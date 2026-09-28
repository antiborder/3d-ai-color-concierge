"""教育トピックのネットワーク（app/data/topic_graph.json）の読み込み。

topic_graph.json の構造:
  - nodes: {id, cluster, label: {ja, en}}  — id は SHOW_CONTENT の content ID と同一
  - edges: {from, to, suggest: {forward: {ja, en}, backward: {ja, en}}}
      forward は from→to へ誘導するときの発話、backward は to→from へ誘導するときの発話。
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

_GRAPH_FILE = Path(__file__).parent.parent.parent / "data" / "topic_graph.json"


@dataclass(frozen=True)
class Neighbor:
    """あるノードから見た隣接ノード。phrase は現在ノード→隣接ノードへ誘導する発話。"""

    id: str
    forward: bool  # 図に描かれた矢印の向きどおりか
    phrase: dict[str, str]


class TopicGraph:
    def __init__(self, data: dict):
        self.nodes: dict[str, dict] = {n["id"]: n for n in data["nodes"]}
        self.node_ids: list[str] = [n["id"] for n in data["nodes"]]
        self._neighbors: dict[str, list[Neighbor]] = {nid: [] for nid in self.node_ids}
        for e in data["edges"]:
            a, b = e["from"], e["to"]
            self._neighbors[a].append(Neighbor(b, True, e["suggest"]["forward"]))
            self._neighbors[b].append(Neighbor(a, False, e["suggest"]["backward"]))

    def neighbors(self, node_id: str) -> list[Neighbor]:
        return self._neighbors.get(node_id, [])

    def cluster(self, node_id: str) -> str | None:
        return self.nodes[node_id].get("cluster")

    def label(self, node_id: str, language: str) -> str:
        return self.nodes[node_id]["label"][language]


@lru_cache(maxsize=1)
def load_topic_graph() -> TopicGraph:
    with _GRAPH_FILE.open(encoding="utf-8") as f:
        return TopicGraph(json.load(f))


def content_ids() -> list[str]:
    """SHOW_CONTENT で表示可能な content ID 一覧（グラフのノード順）。"""
    return list(load_topic_graph().node_ids)
