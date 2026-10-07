"""教育トピックのネットワーク（topic_graph.json）と次トピック推薦のテスト。"""

import json
import random
import re
from pathlib import Path
from types import SimpleNamespace

import pytest

from app.services.gemini_live.tools.educational import (
    CONTENT_IDS,
    build_show_content_response,
)
from app.services.navigation import NavState, load_topic_graph, rank
from app.services.navigation.topic_graph import _GRAPH_FILE
from app.services.prompts.topics import TOPICS, topic_script

FRONTEND_SRC = Path(__file__).resolve().parents[2] / "frontend" / "src"


@pytest.fixture(scope="module")
def raw_graph() -> dict:
    with _GRAPH_FILE.open(encoding="utf-8") as f:
        return json.load(f)


# ── グラフの整合性 ─────────────────────────────────────────────────────────


def test_node_ids_are_unique(raw_graph):
    ids = [n["id"] for n in raw_graph["nodes"]]
    assert len(ids) == len(set(ids))


def test_nodes_have_labels_and_known_clusters(raw_graph):
    clusters = set(raw_graph["clusters"])
    for n in raw_graph["nodes"]:
        assert n["label"]["ja"] and n["label"]["en"], n["id"]
        assert n["cluster"] is None or n["cluster"] in clusters, n["id"]


def test_edges_connect_existing_nodes_without_duplicates(raw_graph):
    ids = {n["id"] for n in raw_graph["nodes"]}
    pairs = set()
    for e in raw_graph["edges"]:
        assert e["from"] in ids and e["to"] in ids, e
        assert e["from"] != e["to"], e
        pair = frozenset((e["from"], e["to"]))
        assert pair not in pairs, f"duplicate edge between {sorted(pair)}"
        pairs.add(pair)


def test_every_edge_has_phrases_for_both_directions_and_languages(raw_graph):
    for e in raw_graph["edges"]:
        for direction in ("forward", "backward"):
            for lang in ("ja", "en"):
                assert e["suggest"][direction][lang].strip(), (e["from"], e["to"], direction, lang)


def test_every_node_is_connected(raw_graph):
    connected = {x for e in raw_graph["edges"] for x in (e["from"], e["to"])}
    assert {n["id"] for n in raw_graph["nodes"]} <= connected


def test_content_ids_match_graph_nodes():
    assert CONTENT_IDS == load_topic_graph().node_ids


# ── フロントエンドとの整合性 ──────────────────────────────────────────────


@pytest.mark.parametrize("lang", ["ja", "en"])
def test_every_node_has_slide_title_in_i18n(lang):
    locale = json.loads((FRONTEND_SRC / "i18n" / "locales" / f"{lang}.json").read_text("utf-8"))
    educational = locale["educational"]
    missing = [nid for nid in CONTENT_IDS if not educational.get(nid, {}).get("title")]
    assert not missing


def test_every_drawn_slide_is_a_graph_node():
    source = (FRONTEND_SRC / "components" / "educational" / "EducationalContent.tsx").read_text(
        "utf-8"
    )
    slides_block = re.search(r"const SLIDES[^{]*\{(.*?)\};", source, re.S)
    assert slides_block
    slide_ids = re.findall(r"^\s*(\w+):", slides_block.group(1), re.M)
    assert slide_ids
    assert set(slide_ids) <= set(CONTENT_IDS)


def test_every_topic_script_is_a_graph_node():
    assert set(TOPICS) <= set(CONTENT_IDS)


# ── rank ───────────────────────────────────────────────────────────────────


def test_rank_returns_direction_specific_phrase():
    # 図の矢印は RGB Cube Grid → RGB色空間。RGB色空間から見ると逆向きの phrase を使う。
    result = rank("rgb_space", ["rgb_space"], set(), "ja", k=50)
    by_id = {s["id"]: s for s in result}
    assert by_id["rgb_cube_grid"]["phrase"] == (
        "この空間で等間隔に並ぶColor Sampleも表示できます。見てみますか？"
    )
    result = rank("rgb_cube_grid", ["rgb_cube_grid"], set(), "ja", k=50)
    by_id = {s["id"]: s for s in result}
    assert by_id["rgb_space"]["phrase"] == (
        "このColor SampleはRGBを元に作られています。RGB色空間も見てみますか？"
    )


def test_rank_excludes_visited_and_declined():
    result = rank("hsl_space", ["rgb_space", "hsl_space"], {"hue"}, "en", k=50)
    ids = [s["id"] for s in result]
    assert "rgb_space" not in ids
    assert "hue" not in ids
    assert "hsl_space" not in ids
    assert "hsb_vs_hsl" in ids


def test_rank_prefers_forward_edges():
    # hsl_space → hsb_vs_hsl は矢印どおり、rgb_space → hsl_space は逆向き
    result = rank("hsl_space", ["hsl_space"], set(), "en", k=50)
    ids = [s["id"] for s in result]
    assert ids.index("hsb_vs_hsl") < ids.index("rgb_space")


def test_rank_boosts_topics_linked_to_other_visited_topics():
    # HSB と HSL を両方見た後は「HSBとHSLの違い」が最上位になる
    result = rank("hsl_space", ["hsb_space", "hsl_space"], set(), "en")
    assert result[0]["id"] == "hsb_vs_hsl"


def test_rank_limits_count_and_includes_title():
    result = rank("hue", ["hue"], set(), "ja")
    assert len(result) == 3
    assert all(s["title"] and s["phrase"] for s in result)


def test_rank_returns_empty_when_all_neighbors_seen():
    graph = load_topic_graph()
    neighbors = [nb.id for nb in graph.neighbors("electromagnetic_wave")]
    assert rank("electromagnetic_wave", ["electromagnetic_wave", *neighbors], set(), "ja") == []


# ── NavState ───────────────────────────────────────────────────────────────


def test_nav_state_suggests_every_other_show():
    nav = NavState()
    nav.mark_shown("rgb_primary")
    assert nav.next_suggestions("ja")
    nav.mark_shown("rgb_space")
    assert nav.next_suggestions("ja") == []
    nav.mark_shown("hsl_space")
    assert nav.next_suggestions("ja")


def test_nav_state_tracks_visited_in_order_without_duplicates():
    nav = NavState()
    for cid in ["rgb_primary", "rgb_space", "rgb_primary"]:
        nav.mark_shown(cid)
    assert nav.visited == ["rgb_primary", "rgb_space"]
    assert nav.current == "rgb_primary"
    nav.mark_dismissed()
    assert nav.current is None


def test_nav_state_never_resuggests_declined_topic():
    nav = NavState()
    nav.mark_shown("hsl_space")
    first = nav.next_suggestions("ja")
    nav.mark_declined(first[0]["id"])
    nav.suggested_last_time = False
    again = nav.next_suggestions("ja")
    assert first[0]["id"] not in [s["id"] for s in again]


# ── SHOW_CONTENT の tool response ───────────────────────────────────────────


def test_show_content_response_for_scripted_topic():
    nav = NavState()
    resp = build_show_content_response("hsl_space", nav, "ja")
    assert resp["result"] == "ok"
    assert resp["title"] == "HSL色空間"
    assert resp["script"]["s1"]
    assert resp["next_suggestions"]
    assert nav.current == "hsl_space"


def test_show_content_response_for_placeholder_topic_has_no_script():
    resp = build_show_content_response("lms_space", NavState(), "en")
    assert resp["result"] == "ok"
    assert resp["title"] == "LMS color space"
    assert resp["script"] is None


def test_show_content_response_rejects_unknown_id():
    nav = NavState()
    resp = build_show_content_response("no_such_topic", nav, "ja")
    assert resp["result"] == "error"
    assert nav.visited == []


# ── topic_script ───────────────────────────────────────────────────────────


def test_topic_script_s2_is_skipped_or_chosen_from_options():
    rng = random.Random(0)
    options = TOPICS["cone_cells"]["s2"]["options"]["ja"]
    seen_s2 = {topic_script("cone_cells", "ja", rng)["s2"] for _ in range(50)}
    assert None in seen_s2
    assert seen_s2 - {None} <= set(options)
    assert len(seen_s2 - {None}) > 1


# ── Gemini Live の tool call 処理（message_receiver）────────────────────────


class _FakeLiveSession:
    def __init__(self):
        self.responses: list = []

    async def send_tool_response(self, function_responses):
        self.responses.append(function_responses)


def _tool_call_msg(name: str, args: dict) -> SimpleNamespace:
    return SimpleNamespace(
        tool_call={"function_calls": [{"name": name, "args": args, "id": "call-1"}]}
    )


def _run_tool_call(name: str, args: dict, nav: NavState):
    import asyncio

    from app.services.gemini_live.config import GeminiLiveConfig
    from app.services.gemini_live.message_receiver import process_live_message

    live = _FakeLiveSession()
    event_q: asyncio.Queue = asyncio.Queue()

    async def run():
        await process_live_message(
            _tool_call_msg(name, args),
            event_q,
            GeminiLiveConfig(model="test", language="ja"),
            live,
            None,
            0.0,
            [],
            "",
            None,
            0,
            "",
            None,
            0,
            "",
            None,
            0,
            nav_state=nav,
        )

    asyncio.run(run())
    events = []
    while not event_q.empty():
        events.append(event_q.get_nowait())
    return live.responses, events


def test_show_content_tool_call_returns_suggestions_and_emits_command():
    nav = NavState()
    responses, events = _run_tool_call("SHOW_CONTENT", {"id": "rgb_space"}, nav)
    assert len(responses) == 1
    resp = responses[0].response
    assert resp["title"] == "RGB色空間"
    assert resp["next_suggestions"]
    assert [e.command["action"] for e in events] == ["SHOW_CONTENT"]
    assert nav.visited == ["rgb_space"]


def test_record_decline_tool_call_updates_nav_state_without_frontend_command():
    nav = NavState()
    responses, events = _run_tool_call("RECORD_DECLINE", {"id": "hex_code"}, nav)
    assert nav.declined == {"hex_code"}
    assert responses[0].response == {"result": "ok"}
    assert events == []


def test_dismiss_content_tool_call_clears_current():
    nav = NavState()
    nav.mark_shown("rgb_space")
    _run_tool_call("DISMISS_CONTENT", {}, nav)
    assert nav.current is None
