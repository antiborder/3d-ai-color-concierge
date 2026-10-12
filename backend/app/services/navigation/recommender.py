"""次に勧めるもの（トピックまたはトピック外の操作）を決める（LLM を使わない）。

スライドの説明や画面の操作のあと、間を置いて Gemini に1件だけ渡し、その1文を言わせる。
候補の妥当性（存在するか、既に見た・断られた・今の画面と同じか）と、どれを勧めるかの抽選は
ここでコードが行う。
"""

from __future__ import annotations

import random
from collections import deque
from dataclasses import dataclass, field

from app.services.navigation.action_graph import ActionGraph, load_action_graph
from app.services.navigation.topic_graph import TopicGraph, load_topic_graph

# スコアの重み
FORWARD_EDGE = 3.0  # 図の矢印どおりの向き
BACKWARD_EDGE = 2.0  # 矢印と逆向き
SAME_CLUSTER = 0.5  # 同じクラスタに留まる
PER_VISITED_LINK = 1.0  # 候補が「既に見た別トピック」ともつながっている（理解の合流点）
MAX_VISITED_LINK_BONUS = 2.0
ACTION_LINK = 2.5  # トピック・操作と、操作とのつながり

MAX_SUGGESTIONS = 3
# スライドの下に出すおすすめタグの最大数
MAX_TAGS = 3
# トピックと操作の両方が候補にあるとき、トピックを勧める確率（残りは操作）
TOPIC_SHARE = 0.6
# 直近この回数に勧めたものは、また勧めない（同じ提案を繰り返さない）
RECENT_SUGGESTION_ROUNDS = 3


@dataclass
class NavState:
    """1セッション分のナビゲーション状態。バックエンドが正とする。"""

    current: str | None = None
    visited: list[str] = field(default_factory=list)
    # 断られた候補（トピック・操作の両方）
    declined: set[str] = field(default_factory=set)
    # 提案を受け入れて実行した操作
    done_actions: set[str] = field(default_factory=set)
    # 直近に勧めたもの（RECENT_SUGGESTION_ROUNDS 回分）
    recent_offers: deque = field(default_factory=lambda: deque(maxlen=RECENT_SUGGESTION_ROUNDS))
    # 明るさ・彩度・色相の調整は、セッションで1回だけ勧める
    adjust_offered: bool = False
    # 説明や操作の報告を言い終えて間を置いてから言う、次の提案（0件か1件）。
    # tool call の時点で保留し、音声の再生が終わってからフロントの合図で Gemini に渡す。
    pending_suggestions: list[dict] = field(default_factory=list)
    pending_token: int = 0
    # 保留したあと Gemini が話し始めたか（その発話の終わりを待つため）
    pending_spoken: bool = False
    # このターンで提案の元にした操作の優先度（ターンの終わりで 0 に戻す）
    turn_priority: int = 0
    # 何を勧めるかの抽選に使う
    rng: random.Random = field(default_factory=random.Random)
    # 今のスライドの下に出しているおすすめタグ
    slide_tags: list[dict] = field(default_factory=list)

    def mark_shown(self, content_id: str) -> None:
        self.current = content_id
        if content_id not in self.visited:
            self.visited.append(content_id)

    def mark_dismissed(self) -> None:
        self.current = None

    def mark_declined(self, node_id: str) -> None:
        self.declined.add(node_id)

    def mark_done(self, action_id: str) -> None:
        self.done_actions.add(action_id)

    def hold_suggestions(self, suggestions: list[dict]) -> None:
        self.pending_suggestions = suggestions
        self.pending_token += 1
        self.pending_spoken = False

    def clear_pending(self) -> None:
        self.pending_suggestions = []
        self.pending_spoken = False
        self.turn_priority = 0

    def take_pending(self, token: int) -> list[dict]:
        """token が今の保留と一致すれば提案を返して保留を解く（古い合図や取り消し済みなら空）。"""
        if token != self.pending_token or not self.pending_suggestions:
            return []
        suggestions = self.pending_suggestions
        self.clear_pending()
        # Gemini はこの1件をそのまま言うので、勧めたものとして覚えておく
        self.recent_offers.append({s["id"] for s in suggestions})
        if any(s.get("group") == "adjust" for s in suggestions):
            self.adjust_offered = True
        return suggestions

    def next_suggestions(
        self,
        context_id: str,
        language: str,
        ui: dict | None = None,
        graph: TopicGraph | None = None,
        actions: ActionGraph | None = None,
    ) -> list[dict]:
        """context_id（今見せたトピック、または直前の操作）の後に勧める1件（候補が無ければ空）。"""
        return choose(suggest(context_id, self, language, ui or {}, graph, actions), self.rng)


def choose(candidates: list[dict], rng: random.Random) -> list[dict]:
    """候補から1件を抽選する。

    トピックと操作の両方があれば TOPIC_SHARE の確率でトピック、残りで操作を選び、
    その中から点数に比例した確率で1件を選ぶ。
    """
    if not candidates:
        return []
    kinds = {c["kind"] for c in candidates}
    if len(kinds) == 2:
        kind = "topic" if rng.random() < TOPIC_SHARE else "action"
    else:
        kind = kinds.pop()
    pool = [c for c in candidates if c["kind"] == kind]
    return [rng.choices(pool, weights=[c["score"] for c in pool])[0]]


def tags_for(held: list[dict], candidates: list[dict], k: int = MAX_TAGS) -> list[dict]:
    """スライドの下に出すおすすめタグ（最大 k 件）。

    口頭で勧めるもの（held）を先頭に、トピックと操作の両方があれば両方が入るようにして、
    残りは点数の高い順。好みを聞く質問（タグを押しても何も起きない）は出さない。
    """
    pool = [c for c in candidates if c["group"] != "talk"]
    picked = [c for c in held if c["group"] != "talk"]
    for kind in ("topic", "action"):
        if not any(c["kind"] == kind for c in picked):
            best = next((c for c in pool if c["kind"] == kind and c not in picked), None)
            if best is not None:
                picked.append(best)
    picked += [c for c in pool if c not in picked]
    return [{"id": c["id"], "kind": c["kind"], "label": c["tag"]} for c in picked[:k]]


def suggest(
    context_id: str,
    nav: NavState,
    language: str,
    ui: dict,
    graph: TopicGraph | None = None,
    actions: ActionGraph | None = None,
    k: int | None = None,
) -> list[dict]:
    """context_id につながるトピックと操作のうち、勧めてよいものを点数の高い順に返す（最大 k 件）。"""
    g = graph or load_topic_graph()
    ag = actions or load_action_graph()
    seen = set(nav.visited)
    recent = set().union(*nav.recent_offers) if nav.recent_offers else set()
    scored: dict[str, tuple[float, str, str]] = {}  # id → (score, phrase, kind)

    def offer(node_id: str, score: float, phrase: str, kind: str) -> None:
        if node_id not in scored or score > scored[node_id][0]:
            scored[node_id] = (score, phrase, kind)

    def visited_bonus(topic_id: str) -> float:
        links = sum(1 for m in g.neighbors(topic_id) if m.id != context_id and m.id in seen)
        return min(links * PER_VISITED_LINK, MAX_VISITED_LINK_BONUS)

    def topic_ok(topic_id: str) -> bool:
        return (
            topic_id != context_id
            and topic_id not in seen
            and topic_id not in nav.declined
            and topic_id not in recent
        )

    def action_ok(action_id: str) -> bool:
        return (
            ag.is_action(action_id)
            and action_id != context_id
            and action_id not in nav.declined
            and action_id not in nav.done_actions
            and action_id not in recent
            and not (nav.adjust_offered and ag.actions[action_id]["kind"] == "adjust")
            and not ag.excluded(action_id, ui)
        )

    if context_id in g.nodes:
        for s in rank(context_id, nav.visited, nav.declined, language, g, k=len(g.node_ids)):
            if s["id"] not in recent:
                offer(s["id"], s["score"], s["phrase"], "topic")
    for other, phrase in ag.links(context_id):
        if other in g.nodes:
            if topic_ok(other) and phrase:
                offer(other, ACTION_LINK + visited_bonus(other), phrase[language], "topic")
        elif action_ok(other):
            offer(other, ACTION_LINK, ag.actions[other]["phrase"][language], "action")

    order = {nid: i for i, nid in enumerate([*g.node_ids, *ag.action_ids])}
    by_score = sorted(scored, key=lambda nid: (-scored[nid][0], order[nid]))[:k]

    def title(nid: str) -> str:
        return g.label(nid, language) if nid in g.nodes else ag.actions[nid]["label"][language]

    def tag(nid: str) -> str:
        return g.short(nid, language) if nid in g.nodes else ag.actions[nid]["tag"][language]

    return [
        {
            "id": nid,
            "kind": scored[nid][2],
            "group": "topic" if nid in g.nodes else ag.actions[nid]["kind"],
            "title": title(nid),
            "tag": tag(nid),
            "phrase": scored[nid][1],
            "score": scored[nid][0],
        }
        for nid in by_score
    ]


def rank(
    current: str,
    visited: list[str],
    declined: set[str],
    language: str,
    graph: TopicGraph | None = None,
    k: int = MAX_SUGGESTIONS,
) -> list[dict]:
    """current（トピック）の隣接トピックをスコア順に最大 k 件返す。既に見たもの・断られたものは除外。"""
    g = graph or load_topic_graph()
    seen = set(visited)
    scored: dict[str, tuple[float, dict[str, str]]] = {}

    for nb in g.neighbors(current):
        if nb.id == current or nb.id in seen or nb.id in declined:
            continue
        score = FORWARD_EDGE if nb.forward else BACKWARD_EDGE
        if g.cluster(nb.id) is not None and g.cluster(nb.id) == g.cluster(current):
            score += SAME_CLUSTER
        visited_links = sum(1 for m in g.neighbors(nb.id) if m.id != current and m.id in seen)
        score += min(visited_links * PER_VISITED_LINK, MAX_VISITED_LINK_BONUS)
        # 同じ2ノード間に複数の辺がある場合は高い方を採用
        if nb.id not in scored or score > scored[nb.id][0]:
            scored[nb.id] = (score, nb.phrase)

    # スコア降順、同点はグラフのノード順（決定的）
    order = {nid: i for i, nid in enumerate(g.node_ids)}
    top = sorted(scored, key=lambda nid: (-scored[nid][0], order[nid]))[:k]
    return [
        {
            "id": nid,
            "title": g.label(nid, language),
            "phrase": scored[nid][1][language],
            "score": scored[nid][0],
        }
        for nid in top
    ]
