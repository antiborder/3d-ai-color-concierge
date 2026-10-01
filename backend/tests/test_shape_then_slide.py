"""色空間の変形 → スライド表示 → 発話 の順序を保証する tool call 処理のテスト。"""

import asyncio
from types import SimpleNamespace

from app.services.gemini_live.config import GeminiLiveConfig
from app.services.gemini_live.message_receiver import process_live_message
from app.services.gemini_live.tools.educational import DECLARATIONS
from app.services.navigation import NavState


class _FakeLiveSession:
    def __init__(self, log: list):
        self._log = log

    async def send_tool_response(self, function_responses):
        self._log.append(("tool_response", function_responses.name))


def _msg(*calls: tuple[str, dict]) -> SimpleNamespace:
    return SimpleNamespace(
        tool_call={
            "function_calls": [
                {"name": name, "args": args, "id": f"call-{i}"}
                for i, (name, args) in enumerate(calls)
            ]
        }
    )


async def _run(msg, frontend_delay_s: float | None):
    """process_live_message を実行し、フロントエンドの tool_result を模擬する。

    frontend_delay_s が None のときはフロントエンドが応答しない（タイムアウト経路）。
    """
    log: list = []
    event_q: asyncio.Queue = asyncio.Queue()
    pending: dict = {}

    async def frontend():
        while True:
            ev = await event_q.get()
            log.append(("command", ev.command["action"], ev.command["parameters"]))
            if ev.tool_name == "SHOW_CONTENT" and frontend_delay_s is not None:
                await asyncio.sleep(frontend_delay_s)
                log.append(("slide_shown",))
                pending[ev.tool_call_id].set_result({"result": "ok"})

    fe = asyncio.create_task(frontend())
    await process_live_message(
        msg,
        event_q,
        GeminiLiveConfig(model="test", language="ja"),
        _FakeLiveSession(log),
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
        pending_tool_futures=pending,
        nav_state=NavState(),
    )
    await asyncio.sleep(0)
    fe.cancel()
    return log, pending


def test_show_content_accepts_color_space():
    show = next(d for d in DECLARATIONS if d["name"] == "SHOW_CONTENT")
    props = show["parameters"]["properties"]
    assert "OKLAB" in props["colorSpace"]["enum"]
    assert show["parameters"]["required"] == ["id"]


def test_color_space_is_passed_to_frontend_command():
    log, _ = asyncio.run(
        _run(_msg(("SHOW_CONTENT", {"id": "oklab_space", "colorSpace": "OKLAB"})), 0.0)
    )
    assert ("command", "SHOW_CONTENT", {"id": "oklab_space", "colorSpace": "OKLAB"}) in log


def test_show_content_response_waits_until_slide_is_shown():
    # Gemini は tool response を受け取ってから話すので、応答はスライド表示の後でなければならない
    log, pending = asyncio.run(_run(_msg(("SHOW_CONTENT", {"id": "oklab_space"})), 0.05))
    order = [entry[0] for entry in log]
    assert order == ["command", "slide_shown", "tool_response"]
    assert pending == {}


def test_show_content_response_still_sent_when_frontend_never_confirms(monkeypatch):
    import app.services.gemini_live.message_receiver as mr

    monkeypatch.setitem(mr._FRONTEND_CONFIRM_TIMEOUT_S, "SHOW_CONTENT", 0.05)
    log, pending = asyncio.run(_run(_msg(("SHOW_CONTENT", {"id": "oklab_space"})), None))
    assert [entry[0] for entry in log] == ["command", "tool_response"]
    assert pending == {}


def test_change_shape_runs_before_show_content_in_same_message():
    # Gemini が SHOW_CONTENT → CHANGE_SHAPE の順で返しても、変形を先に実行する
    log, _ = asyncio.run(
        _run(
            _msg(
                ("SHOW_CONTENT", {"id": "oklab_space"}), ("CHANGE_SHAPE", {"colorSpace": "OKLAB"})
            ),
            0.0,
        )
    )
    commands = [entry[1] for entry in log if entry[0] == "command"]
    assert commands == ["CHANGE_SHAPE", "SHOW_CONTENT"]
