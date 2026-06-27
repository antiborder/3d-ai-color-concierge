from __future__ import annotations

import logging
import time

from app.services.ws.events import (
    UserAudioEvent,
    UserColorHistoryEvent,
    UserColorStateEvent,
    UserStopEvent,
    UserTextMessageEvent,
)
from app.services.ws.listeners.base import AbstractEventListener

logger = logging.getLogger("uvicorn.error")


class UserAudioEventListener(AbstractEventListener):
    async def handle(self, event: UserAudioEvent) -> None:
        ctx = self._ctx
        now = time.time()
        ctx.perf_timestamps["last_audio_received"] = now
        if ctx.perf_timestamps.get("last_audio_sent_to_gemini"):
            elapsed = now - ctx.perf_timestamps["last_audio_sent_to_gemini"]
            logger.info(
                "PERF: audio_received_from_client session_id=%s bytes=%s elapsed_since_last_send=%.3fs",
                ctx.session_id,
                len(event.data),
                elapsed,
            )
        send_start = time.time()
        await ctx.gemini_ws.send_bytes(event.data)
        ctx.perf_timestamps["last_audio_sent_to_gemini"] = time.time()
        elapsed = ctx.perf_timestamps["last_audio_sent_to_gemini"] - send_start
        logger.info(
            "PERF: audio_sent_to_gemini session_id=%s elapsed=%.3fs bytes=%s",
            ctx.session_id,
            elapsed,
            len(event.data),
        )


class UserTextMessageEventListener(AbstractEventListener):
    async def handle(self, event: UserTextMessageEvent) -> None:
        await self._ctx.gemini_ws.send_text(event.text)


class UserColorStateEventListener(AbstractEventListener):
    async def handle(self, event: UserColorStateEvent) -> None:
        ctx = self._ctx
        ctx.color_state = event.color
        ctx.color_updated_at = time.time()
        ctx.gemini_ws.set_color_state(event.color)
        from app.config.settings import settings

        if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
            try:
                logger.info(
                    "LIVE_CHAT_DEBUG recv color_state rgb=(%s,%s,%s) keys=%s",
                    event.color.get("r"),
                    event.color.get("g"),
                    event.color.get("b"),
                    sorted(list(event.color.keys())),
                )
            except Exception:
                logger.info("LIVE_CHAT_DEBUG recv color_state (failed to log details)")


class UserColorHistoryEventListener(AbstractEventListener):
    async def handle(self, event: UserColorHistoryEvent) -> None:
        ctx = self._ctx
        ctx.color_history = event.history
        ctx.gemini_ws.set_color_history(event.history)


class UserStopEventListener(AbstractEventListener):
    async def handle(self, event: UserStopEvent) -> None:
        self._ctx.stop_event.set()
