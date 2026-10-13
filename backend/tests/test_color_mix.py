"""混色（MIX_COLORS）と、色の値を範囲内に収める処理のテスト。"""

import asyncio
from types import SimpleNamespace

import pytest

from app.services.gemini_live.config import GeminiLiveConfig
from app.services.gemini_live.message_receiver import process_live_message
from app.services.gemini_live.tools import tool_call_to_frontend_command
from app.services.gemini_live.tools.color_mix import mix, parse_hex, to_hex
from app.services.gemini_live_types import LiveCommandEvent
from app.services.navigation import NavState
from app.services.navigation.action_graph import load_action_graph

RED, GREEN, BLUE = (255, 0, 0), (0, 255, 0), (0, 0, 255)
CYAN, MAGENTA, YELLOW = (0, 255, 255), (255, 0, 255), (255, 255, 0)
PURPLE = (128, 0, 128)


@pytest.mark.parametrize(
    ("colors", "expected"),
    [
        ([RED, GREEN], YELLOW),
        ([GREEN, BLUE], CYAN),
        ([RED, GREEN, BLUE], (255, 255, 255)),
        ([PURPLE, YELLOW], (255, 255, 128)),
    ],
)
def test_mixing_light_adds_the_colors(colors, expected):
    assert mix(colors, "light") == expected


@pytest.mark.parametrize(
    ("colors", "expected"),
    [
        ([CYAN, MAGENTA], BLUE),
        ([MAGENTA, YELLOW], RED),
        ([CYAN, MAGENTA, YELLOW], (0, 0, 0)),
        ([PURPLE, YELLOW], (128, 0, 0)),
    ],
)
def test_mixing_paint_multiplies_the_colors(colors, expected):
    assert mix(colors, "paint") == expected


def test_hex_parsing_and_formatting():
    assert parse_hex("#800080") == PURPLE
    assert parse_hex("ffff00") == YELLOW
    assert parse_hex("purple") is None
    assert to_hex((255, 255, 128)) == "#FFFF80"


class _FakeLive:
    def __init__(self):
        self.responses: list = []

    async def send_tool_response(self, function_responses):
        self.responses.append(function_responses)


def _process(name: str, args: dict, nav: NavState | None = None):
    live = _FakeLive()
    q: asyncio.Queue = asyncio.Queue()
    msg = SimpleNamespace(tool_call={"function_calls": [{"name": name, "args": args, "id": "c1"}]})

    async def run():
        await process_live_message(
            msg,
            q,
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
    while not q.empty():
        events.append(q.get_nowait())
    return live.responses[0].response, [
        e.command for e in events if isinstance(e, LiveCommandEvent)
    ]


def test_mix_colors_selects_the_mix_and_labels_the_colors():
    nav = NavState()
    args = {
        "colors": [{"name": "紫", "hex": "#800080"}, {"name": "黄色", "hex": "#FFFF00"}],
        "mode": "light",
    }
    resp, commands = _process("MIX_COLORS", args, nav)
    assert resp["result"] == "ok" and resp["hex"] == "#FFFF80" and resp["mode"] == "light"
    assert [c["action"] for c in commands] == ["SELECT_COLOR", "SHOW_COLOR_LABELS"]
    assert commands[0]["parameters"]["color"] == {"r": 255, "g": 255, "b": 128}
    labels = commands[1]["parameters"]["colors"]
    assert [lab["label"] for lab in labels] == ["紫", "黄色", "混色 #FFFF80"]
    # a suggestion follows the mix (light: the primary colors of light, etc.)
    assert nav.pending_suggestions and "next_step" in resp


def test_mix_colors_as_paint():
    args = {
        "colors": [{"name": "シアン", "hex": "#00FFFF"}, {"name": "マゼンタ", "hex": "#FF00FF"}],
        "mode": "paint",
    }
    resp, _ = _process("MIX_COLORS", args)
    assert resp["hex"] == "#0000FF" and resp["mode"] == "paint"


def test_mix_colors_needs_two_valid_colors():
    resp, commands = _process(
        "MIX_COLORS", {"colors": [{"name": "紫", "hex": "purple"}], "mode": "light"}
    )
    assert resp["result"] == "error" and commands == []


def test_mix_context_nodes():
    ag = load_action_graph()
    assert ag.context_for_call("MIX_COLORS", {"mode": "paint"})[0] == "ctx_mix_paint"
    assert ag.context_for_call("MIX_COLORS", {"mode": "light"})[0] == "ctx_mix_light"


def test_out_of_range_channels_are_clamped():
    bridge = tool_call_to_frontend_command(
        "SET_BRIDGE_COLOR", {"side": "right", "r": 1255, "g": 255, "b": -3}
    )
    assert bridge["parameters"] == {"side": "right", "r": 255, "g": 255, "b": 0}
    select = tool_call_to_frontend_command("SELECT_COLOR", {"r": 300, "g": "x", "b": 10})
    assert select["parameters"]["color"] == {"r": 255, "g": 0, "b": 10}
    set_color = tool_call_to_frontend_command("SET_COLOR", {"r": 999})
    assert set_color["parameters"]["r"] == 255
