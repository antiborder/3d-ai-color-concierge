from __future__ import annotations

import asyncio
import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.services.ws.abstract_websocket import AbstractWebSocket
from app.services.ws.events import (
    UserAudioEvent,
    UserColorHistoryEvent,
    UserColorStateEvent,
    UserStopEvent,
    UserTextMessageEvent,
    UserToolResultEvent,
)
from app.services.ws.listeners.user_inbound import (
    UserAudioEventListener,
    UserColorHistoryEventListener,
    UserColorStateEventListener,
    UserStopEventListener,
    UserTextMessageEventListener,
    UserToolResultEventListener,
)

logger = logging.getLogger("uvicorn.error")


def _clamp_int(v, lo: int, hi: int):
    try:
        if isinstance(v, bool):
            return None
        iv = int(v)
    except Exception:
        return None
    if iv < lo:
        iv = lo
    if iv > hi:
        iv = hi
    return iv


def _normalize_color_state(color) -> dict | None:
    if not isinstance(color, dict):
        return None
    r = _clamp_int(color.get("r"), 0, 255)
    g = _clamp_int(color.get("g"), 0, 255)
    b = _clamp_int(color.get("b"), 0, 255)
    if r is None or g is None or b is None:
        return None
    out: dict = {"r": r, "g": g, "b": b}
    opt_specs = {
        "c": (0, 100),
        "m": (0, 100),
        "y": (0, 100),
        "k": (0, 100),
        "h": (0, 360),
        "s": (0, 100),
        "l": (0, 100),
        "hsvS": (0, 100),
        "v": (0, 100),
    }
    for k, (lo, hi) in opt_specs.items():
        if k in color:
            vv = _clamp_int(color.get(k), lo, hi)
            if vv is not None:
                out[k] = vv
    for bridge_key in ("bridgeColorA", "bridgeColorB"):
        bc = color.get(bridge_key)
        if isinstance(bc, dict):
            br = _clamp_int(bc.get("r"), 0, 255)
            bg = _clamp_int(bc.get("g"), 0, 255)
            bb = _clamp_int(bc.get("b"), 0, 255)
            if br is not None and bg is not None and bb is not None:
                out[bridge_key] = {"r": br, "g": bg, "b": bb}
    if "shape" in color and isinstance(color["shape"], str):
        out["shape"] = color["shape"]
    if "mainElement" in color and isinstance(color["mainElement"], str):
        out["mainElement"] = color["mainElement"]
    ui = color.get("uiContext")
    if isinstance(ui, dict):
        out["uiContext"] = ui
    return out


class UserWebSocket(AbstractWebSocket):
    event_registry = {
        UserAudioEvent: UserAudioEventListener,
        UserTextMessageEvent: UserTextMessageEventListener,
        UserColorStateEvent: UserColorStateEventListener,
        UserColorHistoryEvent: UserColorHistoryEventListener,
        UserStopEvent: UserStopEventListener,
        UserToolResultEvent: UserToolResultEventListener,
    }

    def __init__(self, ws: WebSocket) -> None:
        self._ws = ws

    async def receive_loop(self, queue: asyncio.Queue) -> None:
        try:
            while True:
                incoming = await self._ws.receive()
                if "text" in incoming and incoming["text"] is not None:
                    try:
                        payload = json.loads(incoming["text"])
                        msg_type = payload.get("type") if isinstance(payload, dict) else None
                        if msg_type == "stop":
                            await queue.put(UserStopEvent())
                            return
                        if msg_type == "color_history" and isinstance(payload, dict):
                            raw = payload.get("history", [])
                            if isinstance(raw, list):
                                history = [
                                    {
                                        "hex": str(c.get("hex", "")),
                                        "r": max(0, min(255, int(c.get("r", 0)))),
                                        "g": max(0, min(255, int(c.get("g", 0)))),
                                        "b": max(0, min(255, int(c.get("b", 0)))),
                                    }
                                    for c in raw
                                    if isinstance(c, dict)
                                ][:50]
                                await queue.put(UserColorHistoryEvent(history=history))
                        if msg_type == "text_message" and isinstance(payload, dict):
                            text = str(payload.get("text", "")).strip()
                            if text:
                                await queue.put(UserTextMessageEvent(text=text))
                        if msg_type == "color_state" and isinstance(payload, dict):
                            color = _normalize_color_state(payload.get("color"))
                            if color:
                                await queue.put(UserColorStateEvent(color=color))
                        if msg_type == "tool_result" and isinstance(payload, dict):
                            tool_call_id = str(payload.get("tool_call_id", ""))
                            success = bool(payload.get("success", True))
                            data = payload.get("data") or {}
                            if not isinstance(data, dict):
                                data = {}
                            if tool_call_id:
                                await queue.put(UserToolResultEvent(
                                    tool_call_id=tool_call_id,
                                    success=success,
                                    data=data,
                                ))
                    except Exception:
                        continue
                elif "bytes" in incoming and incoming["bytes"] is not None:
                    await queue.put(UserAudioEvent(data=incoming["bytes"]))
        except WebSocketDisconnect:
            await queue.put(UserStopEvent())
        except RuntimeError:
            await queue.put(UserStopEvent())
        except Exception as e:
            try:
                await self._ws.send_text(
                    json.dumps({"type": "error", "message": f"client receive error: {e}"})
                )
            except Exception:
                pass
            await queue.put(UserStopEvent())

    async def send_bytes(self, data: bytes) -> None:
        await self._ws.send_bytes(data)

    async def send_text(self, text: str) -> None:
        await self._ws.send_text(text)
