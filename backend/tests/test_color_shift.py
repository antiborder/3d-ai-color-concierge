"""色を別の色に近づける処理（SHIFT_TOWARD_COLOR）と、背景色の調整・1D Picker の結果のテスト。"""

import asyncio
from types import SimpleNamespace

from app.services.gemini_live.config import GeminiLiveConfig
from app.services.gemini_live.message_receiver import process_live_message
from app.services.gemini_live.tools import tool_call_to_frontend_command
from app.services.gemini_live.tools.color_shift import oklab_to_rgb, rgb_to_oklab, shift_toward
from app.services.gemini_live_types import LiveCommandEvent
from app.services.navigation.action_graph import load_action_graph

NAVY, PURPLE, OLIVE = (0, 0, 128), (128, 0, 128), (128, 128, 0)
STATE = {"r": 0, "g": 0, "b": 128, "uiContext": {"background": "#f5f5dc"}}


class _FakeLive:
    def __init__(self):
        self.responses: list = []

    async def send_tool_response(self, function_responses):
        self.responses.append(function_responses)


def _process(name: str, args: dict, color_state: dict | None, futures: dict | None = None,
             frontend_result: dict | None = None):
    live = _FakeLive()
    q: asyncio.Queue = asyncio.Queue()
    msg = SimpleNamespace(tool_call={"function_calls": [{"name": name, "args": args, "id": "c1"}]})

    async def answer_frontend():
        # Play the frontend: answer the tool call as soon as its future is in place
        while futures is not None and "c1" not in futures:
            await asyncio.sleep(0)
        futures["c1"].set_result(frontend_result)

    async def run():
        task = asyncio.create_task(answer_frontend()) if frontend_result is not None else None
        await process_live_message(
            msg, q, GeminiLiveConfig(model="test", language="ja"), live, color_state, 0.0, [],
            "", None, 0, "", None, 0, "", None, 0, pending_tool_futures=futures,
        )
        if task:
            await task

    asyncio.run(run())
    events = []
    while not q.empty():
        events.append(q.get_nowait())
    return live.responses[0].response, [
        e.command for e in events if isinstance(e, LiveCommandEvent)
    ]


def test_oklab_round_trip():
    for rgb in [NAVY, PURPLE, OLIVE, (255, 255, 255), (0, 0, 0), (18, 200, 77)]:
        assert oklab_to_rgb(rgb_to_oklab(rgb)) == rgb


def test_shift_moves_part_of_the_way():
    assert shift_toward(NAVY, PURPLE, 0) == NAVY
    assert shift_toward(NAVY, PURPLE, 1) == PURPLE
    half = shift_toward(NAVY, PURPLE, 0.5)
    # Between the two: more red than navy, still more blue than red
    assert NAVY[0] < half[0] < PURPLE[0] and half[2] > half[0]


def test_shift_the_selected_color():
    resp, commands = _process("SHIFT_TOWARD_COLOR", {"hex": "#800080", "target": "focused"}, STATE)
    assert resp["result"] == "ok" and resp["before"] == "#000080"
    assert [c["action"] for c in commands] == ["SELECT_COLOR"]
    color = commands[0]["parameters"]["color"]
    assert "#{:02X}{:02X}{:02X}".format(color["r"], color["g"], color["b"]) == resp["hex"]


def test_shift_the_background_sets_the_background_only():
    resp, commands = _process(
        "SHIFT_TOWARD_COLOR", {"hex": "#808000", "amount": 0.2, "target": "background"}, STATE
    )
    assert resp["target"] == "background" and resp["before"] == "#F5F5DC"
    assert [c["action"] for c in commands] == ["SET_BACKGROUND_COLOR"]
    assert commands[0]["parameters"]["hex"] == resp["hex"] != "#808000"


def test_shift_needs_a_hex():
    resp, commands = _process("SHIFT_TOWARD_COLOR", {"hex": "purple", "target": "focused"}, STATE)
    assert resp["result"] == "error" and commands == []


def test_adjust_value_can_target_the_background():
    cmd = tool_call_to_frontend_command(
        "ADJUST_VALUE", {"property": "brightness", "direction": "down", "target": "background"}
    )
    assert cmd["parameters"]["target"] == "background"
    focused = tool_call_to_frontend_command(
        "ADJUST_VALUE", {"property": "brightness", "direction": "down", "target": "focused"}
    )
    assert "target" not in focused["parameters"]


def test_background_operations_count_as_setting_the_background():
    ag = load_action_graph()
    adjust_bg = {"property": "brightness", "direction": "down", "target": "background"}
    assert ag.context_for_call("ADJUST_VALUE", adjust_bg)[0] == "ctx_background_set"
    shift_bg = {"hex": "#808000", "target": "background"}
    assert ag.context_for_call("SHIFT_TOWARD_COLOR", shift_bg)[0] == "ctx_background_set"
    shift_fg = {"hex": "#808000", "target": "focused"}
    assert ag.context_for_call("SHIFT_TOWARD_COLOR", shift_fg)[0] == "ctx_color_selected"


def test_the_1d_picker_reports_the_picked_color():
    resp, commands = _process(
        "SELECT_BRIDGE_POSITION", {"position": 0.5}, STATE, futures={},
        frontend_result={"result": "ok", "data": {"hex": "#7f7f7f"}},
    )
    assert [c["action"] for c in commands] == ["SELECT_BRIDGE_POSITION"]
    assert resp["hex"] == "#7F7F7F"


class _FakeColors:
    def find_closest_colors(self, r, g, b, top_n=5, language="ja"):
        return [{"name": f"#{r:02X}{g:02X}{b:02X}", "tags": ["CSS"]}]


def test_closest_color_of_the_background():
    q: asyncio.Queue = asyncio.Queue()
    live = _FakeLive()
    msg = SimpleNamespace(tool_call={"function_calls": [
        {"name": "GET_CLOSEST_COLOR", "args": {"target": "background"}, "id": "c1"}
    ]})
    asyncio.run(process_live_message(
        msg, q, GeminiLiveConfig(model="test", language="ja"), live, STATE, 0.0, [],
        "", None, 0, "", None, 0, "", None, 0, color_service=_FakeColors(),
    ))
    resp = live.responses[0].response
    assert resp["target"] == "background" and resp["closest"][0]["name"] == "#F5F5DC"


def test_selecting_a_color_reports_its_hex():
    resp, _ = _process("SELECT_COLOR", {"r": 300, "g": 10, "b": 20, "target": "focused"}, STATE)
    assert resp["hex"] == "#FF0A14"
