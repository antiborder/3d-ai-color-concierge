"""次に見せるトピックの候補を決める（LLM を使わない決定的なスコアリング）。

LLM（Gemini Live）は SHOW_CONTENT の tool response に含まれる next_suggestions から
会話の流れに合うものを1つ選んで提案する。候補の妥当性（存在するスライドか、
既に見たか、断られたか）はここでコードが保証する。
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.services.navigation.topic_graph import TopicGraph, load_topic_graph

# スコアの重み
FORWARD_EDGE = 3.0  # 図の矢印どおりの向き
BACKWARD_EDGE = 2.0  # 矢印と逆向き
SAME_CLUSTER = 0.5  # 同じクラスタ（物理・機械・人体・感覚心理）に留まる
PER_VISITED_LINK = 1.0  # 候補が「既に見た別トピック」ともつながっている（理解の合流点）
MAX_VISITED_LINK_BONUS = 2.0

MAX_SUGGESTIONS = 3


@dataclass
class NavState:
    """1セッション分のナビゲーション状態。バックエンドが正とする。"""

    current: str | None = None
    visited: list[str] = field(default_factory=list)
    declined: set[str] = field(default_factory=set)
    # 1回おきに提案する（提案した直後の SHOW_CONTENT では提案しない）
    suggested_last_time: bool = False

    def mark_shown(self, content_id: str) -> None:
        self.current = content_id
        if content_id not in self.visited:
            self.visited.append(content_id)

    def mark_dismissed(self) -> None:
        self.current = None

    def mark_declined(self, content_id: str) -> None:
        self.declined.add(content_id)

    def next_suggestions(self, language: str, graph: TopicGraph | None = None) -> list[dict]:
        """SHOW_CONTENT 直後に呼ぶ。提案しない回は空リストを返す（1回おき）。"""
        if self.suggested_last_time or self.current is None:
            self.suggested_last_time = False
            return []
        suggestions = rank(self.current, self.visited, self.declined, language, graph)
        self.suggested_last_time = bool(suggestions)
        return suggestions


def rank(
    current: str,
    visited: list[str],
    declined: set[str],
    language: str,
    graph: TopicGraph | None = None,
    k: int = MAX_SUGGESTIONS,
) -> list[dict]:
    """current の隣接ノードをスコア順に最大 k 件返す。既に見たもの・断られたものは除外。"""
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
        {"id": nid, "title": g.label(nid, language), "phrase": scored[nid][1][language]}
        for nid in top
    ]
