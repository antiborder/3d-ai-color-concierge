"""トピック外の操作（action_graph.json）を含めた提案のテスト。"""

import asyncio
import json
from types import SimpleNamespace

import pytest

from app.services.gemini_live.config import GeminiLiveConfig
from app.services.gemini_live.message_receiver import process_live_message
from app.services.gemini_live.tools import live_tools
from app.services.gemini_live_types import LiveCommandEvent
from app.services.navigation import NavState, load_topic_graph
from app.services.navigation.action_graph import _GRAPH_FILE, load_action_graph, ui_state_of
from app.services.navigation.recommender import suggest


@pytest.fixture(scope="module")
def raw() -> dict:
    with _GRAPH_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def _declared_tools() -> dict[str, dict]:
    return {d["name"]: d for d in live_tools()[0]["function_declarations"]}


# ── グラフの整合性 ─────────────────────────────────────────────────────────


def test_ids_are_unique_and_do_not_clash_with_topics(raw):
    ids = [a["id"] for a in raw["actions"]] + [c["id"] for c in raw["contexts"]]
    assert len(ids) == len(set(ids))
    assert not set(ids) & set(load_topic_graph().node_ids)


def test_every_action_has_labels_phrases_and_a_way_to_run(raw):
    for a in raw["actions"]:
        for lang in ("ja", "en"):
            assert a["label"][lang].strip() and a["phrase"][lang].strip(), a["id"]
        if a["kind"] != "talk":
            assert "run" in a or "instruction" in a, a["id"]


def test_run_calls_use_declared_tools_with_valid_arguments(raw):
    tools = _declared_tools()
    for a in raw["actions"]:
        for c in a.get("run", []):
            assert c["name"] in tools, (a["id"], c["name"])
            props = tools[c["name"]].get("parameters", {}).get("properties", {})
            for key, value in c["args"].items():
                assert key in props, (a["id"], key)
                if "enum" in props[key]:
                    assert value in props[key]["enum"], (a["id"], key, value)


def test_links_connect_known_nodes_and_topic_offers_have_phrases(raw):
    topics = set(load_topic_graph().node_ids)
    actions = {a["id"] for a in raw["actions"]}
    contexts = {c["id"] for c in raw["contexts"]}
    for link in raw["links"]:
        assert link["from"] in actions | contexts, link
        assert link["to"] in topics | actions, link
        if link["to"] in topics:
            assert link["phrase"]["ja"].strip() and link["phrase"]["en"].strip(), link


def test_every_topic_links_to_an_action(raw):
    linked = {link["to"] for link in raw["links"]}
    assert set(load_topic_graph().node_ids) <= linked


# ── 候補の選び方 ───────────────────────────────────────────────────────────


def test_after_a_slide_both_topics_and_actions_are_candidates():
    nav = NavState()
    nav.mark_shown("brightness")
    result = suggest("brightness", nav, "ja", {})
    kinds = {s["kind"] for s in result}
    assert kinds == {"topic", "action"}
    assert [s["score"] for s in result] == sorted((s["score"] for s in result), reverse=True)


def test_after_an_action_its_topics_and_actions_are_candidates():
    result = suggest("act_harmony_complementary", NavState(), "ja", {}, k=50)
    by_id = {s["id"]: s for s in result}
    assert by_id["complementary_colors"]["kind"] == "topic"
    assert (
        by_id["complementary_colors"]["phrase"] == "補色について、スライドでくわしく見てみますか？"
    )
    assert by_id["act_harmony_triad"]["phrase"] == "三角配色を表示してみますか？"
    assert "act_harmony_complementary" not in by_id  # not the action just done


def test_links_between_actions_go_one_way_unless_marked_both():
    after_pick = {s["id"] for s in suggest("act_pick_sky", NavState(), "ja", {})}
    after_complement = {s["id"] for s in suggest("act_harmony_complementary", NavState(), "ja", {})}
    assert "act_harmony_complementary" in after_pick
    assert "act_pick_sky" not in after_complement
    after_darker = {s["id"] for s in suggest("act_darker", NavState(), "ja", {})}
    assert "act_lighter" in after_darker  # lighter ↔ darker is marked both


def test_context_nodes_are_never_offered():
    result = suggest("act_closest_name", NavState(), "ja", {}, k=50)
    assert not any(s["id"].startswith("ctx_") for s in result)


def test_candidates_already_on_screen_are_excluded():
    ui = {
        "shape": "HSB",
        "colorSamples": {"japanese": True},
        "hex": "#a0d8ef",
        "background": "#000000",
    }
    ids = {s["id"] for s in suggest("act_shape_hsl", NavState(), "ja", ui, k=50)}
    assert "act_shape_hsb" not in ids
    ids = {s["id"] for s in suggest("act_sets_css", NavState(), "ja", ui, k=50)}
    assert "act_sets_japanese" not in ids
    ids = {s["id"] for s in suggest("warm_cool_colors", NavState(), "ja", ui, k=50)}
    assert "act_pick_sky" not in ids and "act_pick_akane" in ids
    ids = {s["id"] for s in suggest("act_bg_white", NavState(), "ja", ui, k=50)}
    assert "act_bg_black" not in ids


def test_declined_done_and_recently_offered_actions_are_excluded():
    nav = NavState()
    nav.mark_declined("act_lighter")
    nav.mark_done("act_darker")
    nav.recent_offers.append({"act_shape_hsb"})
    ids = {s["id"] for s in suggest("brightness", nav, "ja", {}, k=50)}
    assert not ids & {"act_lighter", "act_darker", "act_shape_hsb"}


def test_what_was_offered_is_not_offered_again_for_a_few_rounds():
    nav = NavState()
    nav.hold_suggestions(nav.next_suggestions("brightness", "ja"))
    [offered] = nav.take_pending(nav.pending_token)
    assert offered["id"] not in {s["id"] for s in suggest("brightness", nav, "ja", {})}


def test_adjustments_are_offered_once_per_session():
    nav = NavState()
    adjust = next(s for s in suggest("brightness", nav, "ja", {}) if s["group"] == "adjust")
    nav.hold_suggestions([adjust])
    nav.take_pending(nav.pending_token)
    groups = {
        s["group"] for s in suggest("act_pick_sky", nav, "ja", {}) + suggest("tone", nav, "ja", {})
    }
    assert "adjust" not in groups


def test_one_suggestion_is_drawn_topics_six_to_actions_four():
    import random

    from app.services.navigation.recommender import choose

    candidates = suggest("brightness", NavState(), "ja", {})
    rng = random.Random(0)
    picks = [choose(candidates, rng)[0] for _ in range(4000)]
    topic_share = sum(p["kind"] == "topic" for p in picks) / len(picks)
    assert 0.57 < topic_share < 0.63
    # within topics, a higher score is drawn more often
    topics = [c for c in candidates if c["kind"] == "topic"]
    counts = {c["id"]: sum(p["id"] == c["id"] for p in picks) for c in topics}
    best, worst = topics[0], topics[-1]
    if best["score"] > worst["score"]:
        assert counts[best["id"]] > counts[worst["id"]]


def test_only_one_kind_is_drawn_when_the_other_is_missing():
    import random

    from app.services.navigation.recommender import choose

    actions_only = [c for c in suggest("brightness", NavState(), "ja", {}) if c["kind"] == "action"]
    assert all(choose(actions_only, random.Random(i))[0]["kind"] == "action" for i in range(20))
    assert choose([], random.Random(0)) == []


def test_ui_state_is_read_from_the_frontend_color_state():
    ui = ui_state_of(
        {
            "r": 160,
            "g": 216,
            "b": 239,
            "shape": "HSB",
            "uiContext": {
                "harmony": "none",
                "colorSamples": {"css": True},
                "background": "#000000",
            },
        }
    )
    assert ui == {
        "shape": "HSB",
        "harmony": "none",
        "colorSamples": {"css": True},
        "background": "#000000",
        "hex": "#a0d8ef",
    }


# ── tool call を「直前の操作」に対応させる ──────────────────────────────────


@pytest.mark.parametrize(
    ("name", "args", "node"),
    [
        (
            "ADJUST_VALUE",
            {"property": "brightness", "direction": "up", "amount": 10},
            "act_lighter",
        ),
        (
            "ADJUST_VALUE",
            {"property": "saturation", "direction": "down", "amount": 100},
            "act_make_gray",
        ),
        ("ADJUST_VALUE", {"property": "hue", "direction": "up", "amount": 180}, "act_hue_opposite"),
        ("SET_HARMONY", {"mode": "triangle"}, "act_harmony_triad"),
        ("CHANGE_SHAPE", {"colorSpace": "OKLCH"}, "act_shape_oklch"),
        ("SET_COLOR_SETS", {"japanese": True}, "act_sets_japanese"),
        ("SET_HEX", {"hex": "#FF00FF"}, "act_pick_magenta"),
        ("SET_HEX", {"hex": "123456"}, "ctx_color_selected"),
        ("SET_HEX", {"hex": "123456", "target": "background"}, "ctx_background_set"),
        ("SELECT_COLOR", {"r": 1, "g": 2, "b": 3}, "ctx_color_selected"),
        ("SET_BACKGROUND_COLOR", {"hex": "#000000"}, "act_bg_black"),
        ("SET_BACKGROUND_COLOR", {"hex": "#222244"}, "ctx_background_set"),
        ("SHOW_COLOR_LABELS", {"colors": []}, "ctx_colors_shown"),
        ("GET_CLOSEST_COLOR", {}, "act_closest_name"),
    ],
)
def test_tool_calls_map_to_nodes(name, args, node):
    assert load_action_graph().context_for_call(name, args)[0] == node


@pytest.mark.parametrize(
    ("name", "args"),
    [
        ("GET_UI_STATE", {}),
        ("SEARCH_COLOR", {"query": "red"}),
        ("SET_HARMONY", {"mode": "none"}),
        ("CHANGE_SHAPE", {"colorSpace": "xyz"}),
        ("DISMISS_CONTENT", {}),
    ],
)
def test_calls_that_change_nothing_suggestable_map_to_nothing(name, args):
    assert load_action_graph().context_for_call(name, args) is None


# ── Gemini Live の tool call 処理 ──────────────────────────────────────────


class _FakeLive:
    def __init__(self):
        self.responses: list = []

    async def send_tool_response(self, function_responses):
        self.responses.append(function_responses)


def _process(calls: list[tuple[str, dict]], nav: NavState, color_state: dict | None = None):
    live = _FakeLive()
    q: asyncio.Queue = asyncio.Queue()
    msg = SimpleNamespace(
        tool_call={
            "function_calls": [
                {"name": n, "args": a, "id": f"call-{i}"} for i, (n, a) in enumerate(calls)
            ]
        }
    )

    async def run():
        await process_live_message(
            msg,
            q,
            GeminiLiveConfig(model="test", language="ja"),
            live,
            color_state,
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
    while not q.empty():
        events.append(q.get_nowait())
    return {r.name: r.response for r in live.responses}, events


def test_an_action_holds_suggestions_and_asks_for_a_plain_report():
    nav = NavState()
    responses, _ = _process([("SET_HARMONY", {"mode": "complementary"})], nav)
    [held] = nav.pending_suggestions
    assert held["id"] in {
        s["id"] for s in suggest("act_harmony_complementary", NavState(), "ja", {})
    }
    assert "next_step" in responses["SET_HARMONY"]


def test_a_lookup_holds_nothing():
    nav = NavState()
    responses, _ = _process([("SEARCH_COLOR", {"query": "red"})], nav)
    assert nav.pending_suggestions == []


def test_the_most_important_action_of_a_turn_is_used():
    # CHANGE_SHAPE runs first in a message, but the brightness change is what the user asked for
    nav = NavState()
    _process(
        [
            ("ADJUST_VALUE", {"property": "brightness", "direction": "up", "amount": 10}),
            ("CHANGE_SHAPE", {"colorSpace": "OKLCH"}),
        ],
        nav,
    )
    [held] = nav.pending_suggestions
    assert held["id"] in {s["id"] for s in suggest("act_lighter", NavState(), "ja", {})}
    assert held["id"] not in {"oklch_space", "act_shape_oklab"}  # these come from act_shape_oklch


def test_turn_complete_resets_the_turn_priority():
    nav = NavState()
    nav.turn_priority = 80
    q: asyncio.Queue = asyncio.Queue()

    async def run():
        await process_live_message(
            SimpleNamespace(server_content=SimpleNamespace(turn_complete=True)),
            q,
            GeminiLiveConfig(model="test", language="ja"),
            _FakeLive(),
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
    assert nav.turn_priority == 0


def test_run_suggestion_performs_the_action_and_holds_the_next_suggestions():
    nav = NavState()
    responses, events = _process([("RUN_SUGGESTION", {"id": "act_bridge_blue_white"})], nav)
    commands = [e.command for e in events if isinstance(e, LiveCommandEvent)]
    assert [c["action"] for c in commands] == [
        "CHANGE_SHAPE",
        "SET_BRIDGE_COLOR",
        "SET_BRIDGE_COLOR",
    ]
    assert commands[0]["parameters"] == {"colorSpace": "Lab"}
    assert "act_bridge_blue_white" in nav.done_actions
    [held] = nav.pending_suggestions
    assert held["id"] in {"lab_vs_oklab", "oklch_vs_lch", "act_shape_lch"}
    resp = responses["RUN_SUGGESTION"]
    assert resp["result"] == "ok" and resp["done"] == "青と白のグラデーション"
    assert "next_step" in resp


def test_run_suggestion_of_an_ai_run_action_returns_its_instruction():
    nav = NavState()
    responses, events = _process([("RUN_SUGGESTION", {"id": "act_background_contrast"})], nav)
    assert not [e for e in events if isinstance(e, LiveCommandEvent)]
    assert "SET_BACKGROUND_COLOR" in responses["RUN_SUGGESTION"]["instruction"]


def test_run_suggestion_and_record_decline_accept_action_ids():
    tools = _declared_tools()
    run_ids = tools["RUN_SUGGESTION"]["parameters"]["properties"]["id"]["enum"]
    decline_ids = tools["RECORD_DECLINE"]["parameters"]["properties"]["id"]["enum"]
    assert "act_lighter" in run_ids and "act_ask_preference" not in run_ids
    assert "act_lighter" in decline_ids and "hue" in decline_ids


# ── スライド下のおすすめタグ ────────────────────────────────────────────────


def test_every_topic_and_action_has_a_short_tag_name(raw):
    graph = load_topic_graph()
    for nid in graph.node_ids:
        for lang in ("ja", "en"):
            # up to 3 tags share a 300px row at 14px (Japanese characters are about twice as wide)
            limit = 12 if lang == "ja" else 18
            assert 0 < len(graph.short(nid, lang)) <= limit, (nid, lang)
    for a in raw["actions"]:
        for lang in ("ja", "en"):
            assert 0 < len(a["tag"][lang]) <= 20, (a["id"], lang)


def test_slide_tags_start_with_the_spoken_one_and_mix_kinds():
    from app.services.gemini_live.tools.educational import build_show_content_response

    nav = NavState()
    build_show_content_response("brightness", nav, "ja")
    tags = nav.slide_tags
    assert 1 <= len(tags) <= 3
    assert tags[0]["id"] == nav.pending_suggestions[0]["id"]
    assert {t["kind"] for t in tags} == {"topic", "action"}
    short = {t["id"]: t["label"] for t in tags}
    graph = load_topic_graph()
    for t in tags:
        if t["kind"] == "topic":
            assert short[t["id"]] == graph.short(t["id"], "ja")


def test_slide_tags_never_include_the_mood_question():
    from app.services.navigation.recommender import tags_for

    ask = {
        "id": "act_ask_preference",
        "kind": "action",
        "group": "talk",
        "tag": "好みを話す",
        "score": 9,
    }
    hue = {"id": "hue", "kind": "topic", "group": "topic", "tag": "色相", "score": 3}
    assert [t["id"] for t in tags_for([ask], [ask, hue])] == ["hue"]


def test_tag_prompt_asks_for_the_right_tool():
    from app.services.gemini_live.tools.educational import build_tag_prompt

    assert 'SHOW_CONTENT(id="tone")' in build_tag_prompt("tone", "ja")
    assert 'RUN_SUGGESTION(id="act_lighter")' in build_tag_prompt("act_lighter", "en")
    assert build_tag_prompt("act_ask_preference", "ja") is None
    assert build_tag_prompt("no_such_id", "ja") is None


def test_a_slide_that_switches_the_color_space_does_not_offer_that_space():
    nav = NavState()
    _process([("SHOW_CONTENT", {"id": "hsb_space", "colorSpace": "HSB"})], nav)
    assert "act_shape_hsb" not in [t["id"] for t in nav.slide_tags]


def test_tag_prompt_says_where_the_topic_was_chosen():
    from app.services.gemini_live.tools.educational import build_tag_prompt

    assert "トピックネットワーク" in build_tag_prompt("hue", "ja", "network")
    assert "おすすめタグ" in build_tag_prompt("hue", "ja")
    assert "topic network" in build_tag_prompt("hue", "en", "network")


def test_open_topic_network_is_a_tool_with_a_frontend_command():
    from app.services.gemini_live.tools import tool_call_to_frontend_command

    assert "OPEN_TOPIC_NETWORK" in _declared_tools()
    assert tool_call_to_frontend_command("OPEN_TOPIC_NETWORK", {}) == {
        "action": "OPEN_TOPIC_NETWORK",
        "parameters": {},
    }
