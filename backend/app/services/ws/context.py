from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.services.ws.gemini_websocket import GeminiWebSocket
    from app.services.ws.user_websocket import UserWebSocket


@dataclass
class SessionContext:
    session_id: int
    stop_event: asyncio.Event
    language: str
    color_service: Any | None
    perf_timestamps: dict
    gemini_ws: GeminiWebSocket | None = None
    user_ws: UserWebSocket | None = None
    color_state: dict | None = None
    color_updated_at: float = 0.0
    color_history: list[dict] = field(default_factory=list)
