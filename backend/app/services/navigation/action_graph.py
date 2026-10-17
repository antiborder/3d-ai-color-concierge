"""トピック外の提案（操作ノード）のグラフ（app/data/action_graph.json）の読み込み。

action_graph.json の構造:
  - actions: {id, kind, label, tag, phrase, run?, instruction?, exclude_if?}
      提案できる操作。tag はスライド下のタグに出す短い名前、phrase は提案するときの発話。受け入れられたら run の tool call を
      順に実行する（run が無く instruction がある操作は、Gemini が instruction に従って実行する）。
      exclude_if に一致する状態のとき（既にその表示になっている等）は提案しない。
  - contexts: {id, label}
      提案はしないが、直前に行われた操作を表すノード（色を選んだ、背景を変えた等）。
  - links: {from, to, phrase?, both?}
      from は操作・コンテキスト、to はトピックまたは操作。
      to がトピックのときは両方向で使う（phrase は from の後にトピックを勧めるときの発話。
      トピックの後に操作を勧めるときは、その操作の phrase）。
      to が操作のときは from の後に to を勧める向きだけ。both が true なら逆向きにも勧める。
"""

from __future__ import annotations

import json
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

_GRAPH_FILE = Path(__file__).parent.parent.parent / "data" / "action_graph.json"

# 1ターンに複数の操作があったとき、どれを「直前の操作」とするか（大きいほど優先）
PRIORITY_SHOW_CONTENT = 100
PRIORITY_RUN_SUGGESTION = 90
_PRIORITY = {
    "ADJUST_VALUE": 80,
    "MIX_COLORS": 75,
    "SHIFT_TOWARD_COLOR": 75,
    "SELECT_COLOR": 70,
    "SET_COLOR": 70,
    "SET_HEX": 70,
    "SELECT_BRIDGE_POSITION": 70,
    "SET_HARMONY": 60,
    "SET_BACKGROUND_COLOR": 55,
    "SET_COLOR_SETS": 50,
    "SHOW_COLOR_LABELS": 45,
    "GET_CLOSEST_COLOR": 40,
    "CHANGE_SHAPE": 30,
}


class ActionGraph:
    def __init__(self, data: dict):
        self.actions: dict[str, dict] = {a["id"]: a for a in data["actions"]}
        self.action_ids: list[str] = [a["id"] for a in data["actions"]]
        self.contexts: dict[str, dict] = {c["id"]: c for c in data["contexts"]}
        # node id → [(other node id, phrase for offering the other node when it is a topic)]
        self._links: dict[str, list[tuple[str, dict | None]]] = defaultdict(list)
        for link in data["links"]:
            a, b = link["from"], link["to"]
            self._links[a].append((b, link.get("phrase")))
            if b not in self.actions or link.get("both"):
                self._links[b].append((a, None))
        # SET_HEX / SET_BACKGROUND_COLOR with these colors count as the matching action
        self._by_hex: dict[tuple[str, str], str] = {}
        for a in data["actions"]:
            for c in a.get("run", []):
                if c["name"] == "SET_HEX":
                    self._by_hex[("SET_HEX", c["args"]["hex"].lower())] = a["id"]
                if c["name"] == "SET_BACKGROUND_COLOR":
                    self._by_hex[("SET_BACKGROUND_COLOR", c["args"]["hex"].lower())] = a["id"]

    def links(self, node_id: str) -> list[tuple[str, dict | None]]:
        return self._links.get(node_id, [])

    def is_action(self, node_id: str) -> bool:
        return node_id in self.actions

    def runnable_ids(self) -> list[str]:
        """RUN_SUGGESTION で実行できる操作（run か instruction を持つもの）。"""
        return [
            i
            for i in self.action_ids
            if "run" in self.actions[i] or "instruction" in self.actions[i]
        ]

    def excluded(self, action_id: str, ui: dict) -> bool:
        """今の画面の状態では提案する意味がない（既にその状態になっている）か。"""
        for key, value in self.actions[action_id].get("exclude_if", {}).items():
            if key == "colorSamples":
                if (ui.get("colorSamples") or {}).get(value):
                    return True
            elif isinstance(ui.get(key), str) and ui[key].lower() == str(value).lower():
                return True
        return False

    def context_for_call(self, name: str, args: dict) -> tuple[str, int] | None:
        """tool call を、直前の操作を表すノードと優先度に対応させる。対応しなければ None。"""
        priority = _PRIORITY.get(name)
        if priority is None:
            return None
        node = self._node_for_call(name, args)
        return (node, priority) if node else None

    def _node_for_call(self, name: str, args: dict) -> str | None:
        if name == "ADJUST_VALUE":
            if args.get("target") == "background":
                return "ctx_background_set"
            prop, up = args.get("property"), args.get("direction") == "up"
            amount = _number(args.get("amount"))
            if prop == "brightness":
                return "act_lighter" if up else "act_darker"
            if prop == "saturation":
                if up:
                    return "act_more_vivid"
                return "act_make_gray" if amount >= 100 else "act_less_vivid"
            if prop == "hue":
                return "act_hue_opposite" if amount == 180 else "act_shift_hue"
            return None
        if name in ("SELECT_COLOR", "SET_COLOR", "SET_HEX", "SELECT_BRIDGE_POSITION", "SHIFT_TOWARD_COLOR"):
            if args.get("target") == "background":
                return "ctx_background_set"
            if name == "SET_HEX":
                hex_ = str(args.get("hex", "")).lower()
                hex_ = hex_ if hex_.startswith("#") else f"#{hex_}"
                return self._by_hex.get(("SET_HEX", hex_), "ctx_color_selected")
            return "ctx_color_selected"
        if name == "SET_HARMONY":
            mode = args.get("mode")
            return next(
                (
                    i
                    for i in self.action_ids
                    if self.actions[i].get("exclude_if", {}).get("harmony") == mode
                ),
                None,
            )
        if name == "SET_BACKGROUND_COLOR":
            hex_ = str(args.get("hex", "")).lower()
            hex_ = hex_ if hex_.startswith("#") else f"#{hex_}"
            return self._by_hex.get(("SET_BACKGROUND_COLOR", hex_), "ctx_background_set")
        if name == "SET_COLOR_SETS":
            shown = next((k for k, v in args.items() if v is True), None)
            return f"act_sets_{shown.lower()}" if shown else None
        if name == "MIX_COLORS":
            return "ctx_mix_paint" if args.get("mode") in ("paint", "pigment") else "ctx_mix_light"
        if name == "SHOW_COLOR_LABELS":
            return "ctx_colors_shown"
        if name == "GET_CLOSEST_COLOR":
            return "act_closest_name"
        if name == "CHANGE_SHAPE":
            space = args.get("colorSpace")
            return next(
                (
                    i
                    for i in self.action_ids
                    if self.actions[i].get("exclude_if", {}).get("shape") == space
                ),
                None,
            )
        return None


def _number(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def ui_state_of(color_state: dict | None) -> dict:
    """フロントから届く color_state から、提案の除外判定に使う画面の状態を取り出す。"""
    if not isinstance(color_state, dict):
        return {}
    ui = color_state.get("uiContext") or {}
    state: dict = {
        "shape": color_state.get("shape"),
        "harmony": ui.get("harmony"),
        "colorSamples": ui.get("colorSamples"),
        "background": ui.get("background"),
    }
    try:
        state["hex"] = "#{:02x}{:02x}{:02x}".format(
            int(color_state["r"]), int(color_state["g"]), int(color_state["b"])
        )
    except (KeyError, TypeError, ValueError):
        pass
    return state


@lru_cache(maxsize=1)
def load_action_graph() -> ActionGraph:
    with _GRAPH_FILE.open(encoding="utf-8") as f:
        return ActionGraph(json.load(f))
