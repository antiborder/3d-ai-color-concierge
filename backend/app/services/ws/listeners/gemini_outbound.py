from __future__ import annotations

import json
import logging
import time

from app.services.gemini_live_types import (
    LiveAssistantTextEvent,
    LiveAudioChunk,
    LiveCommandEvent,
    LiveErrorEvent,
    LiveInterruptedEvent,
    LiveTranscriptEvent,
)
from app.services.ws.listeners.base import AbstractEventListener

logger = logging.getLogger("uvicorn.error")


class GeminiAudioEventListener(AbstractEventListener):
    async def handle(self, event: LiveAudioChunk) -> None:
        if event.direction != "out":
            return
        ctx = self._ctx
        now = time.time()
        if not ctx.perf_timestamps.get("first_audio_chunk_logged"):
            ctx.perf_timestamps["first_audio_chunk_logged"] = True
            if ctx.perf_timestamps.get("last_audio_sent_to_gemini"):
                elapsed = now - ctx.perf_timestamps["last_audio_sent_to_gemini"]
                logger.info(
                    "PERF: first_audio_chunk_from_gemini session_id=%s elapsed_since_send=%.3fs bytes=%s",
                    ctx.session_id,
                    elapsed,
                    len(event.data),
                )
        if not ctx.perf_timestamps.get("last_gemini_response"):
            ctx.perf_timestamps["last_gemini_response"] = now
        await ctx.user_ws.send_bytes(event.data)
        ctx.perf_timestamps["last_response_sent"] = time.time()


class GeminiTranscriptEventListener(AbstractEventListener):
    async def handle(self, event: LiveTranscriptEvent) -> None:
        ctx = self._ctx
        now = time.time()
        if not ctx.perf_timestamps.get("last_gemini_response"):
            ctx.perf_timestamps["last_gemini_response"] = now
            if ctx.perf_timestamps.get("last_audio_sent_to_gemini"):
                elapsed = now - ctx.perf_timestamps["last_audio_sent_to_gemini"]
                logger.info(
                    "PERF: first_transcript_from_gemini session_id=%s elapsed_since_send=%.3fs text_len=%s",
                    ctx.session_id,
                    elapsed,
                    len(event.text) if event.text else 0,
                )
        from app.config.settings import settings

        if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
            logger.info(
                "LIVE_CHAT_DEBUG send transcript final=%s txt_len=%s txt_preview=%r",
                event.is_final,
                len(event.text) if event.text else 0,
                event.text[:200] if event.text else None,
            )
        await ctx.user_ws.send_text(
            json.dumps(
                {
                    "type": "transcript",
                    "text": event.text,
                    "final": event.is_final,
                    "language": event.language,
                    "segmentId": event.segment_id,
                }
            )
        )
        if event.is_final and event.text and ctx.conv_logger:
            ctx.conv_logger.add_user_transcript(event.text)


class GeminiAssistantTextEventListener(AbstractEventListener):
    async def handle(self, event: LiveAssistantTextEvent) -> None:
        ctx = self._ctx
        now = time.time()
        if not ctx.perf_timestamps.get("last_gemini_response"):
            ctx.perf_timestamps["last_gemini_response"] = now
            if ctx.perf_timestamps.get("last_audio_sent_to_gemini"):
                elapsed = now - ctx.perf_timestamps["last_audio_sent_to_gemini"]
                logger.info(
                    "PERF: first_assistant_text_from_gemini session_id=%s elapsed_since_send=%.3fs text_len=%s",
                    ctx.session_id,
                    elapsed,
                    len(event.text) if event.text else 0,
                )
        from app.config.settings import settings

        if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
            logger.info(
                "LIVE_CHAT_DEBUG send assistant_text source=%s segmentId=%s final=%s txt_len=%s txt_preview=%r",
                event.source,
                event.segment_id,
                event.is_final,
                len(event.text) if event.text else 0,
                event.text[:200] if event.text else None,
            )
        await ctx.user_ws.send_text(
            json.dumps(
                {
                    "type": "assistant_text",
                    "text": event.text,
                    "source": event.source,
                    "segmentId": event.segment_id,
                    "final": event.is_final,
                }
            )
        )
        if event.is_final and event.text and ctx.conv_logger:
            ctx.conv_logger.add_assistant_text(event.text, segment_id=event.segment_id)


class GeminiErrorEventListener(AbstractEventListener):
    async def handle(self, event: LiveErrorEvent) -> None:
        await self._ctx.user_ws.send_text(
            json.dumps(
                {
                    "type": "error",
                    "message": event.message,
                    "code": event.code,
                }
            )
        )


class GeminiInterruptedEventListener(AbstractEventListener):
    async def handle(self, event: LiveInterruptedEvent) -> None:
        await self._ctx.user_ws.send_text(json.dumps({"type": "interrupted"}))


class GeminiCommandEventListener(AbstractEventListener):
    async def handle(self, event: LiveCommandEvent) -> None:
        ctx = self._ctx
        now = time.time()
        if not ctx.perf_timestamps.get("last_gemini_response"):
            ctx.perf_timestamps["last_gemini_response"] = now
            if ctx.perf_timestamps.get("last_audio_sent_to_gemini"):
                elapsed = now - ctx.perf_timestamps["last_audio_sent_to_gemini"]
                action = event.command.get("action") if isinstance(event.command, dict) else None
                logger.info(
                    "PERF: first_command_from_gemini session_id=%s elapsed_since_send=%.3fs action=%s",
                    ctx.session_id,
                    elapsed,
                    action,
                )
        if event.tool_name == "ADJUST_VALUE":
            await ctx.user_ws.send_text(
                json.dumps(
                    {
                        "type": "executing",
                        "tool_name": event.tool_name,
                        "tool_call_id": event.tool_call_id,
                    }
                )
            )
        await ctx.user_ws.send_text(
            json.dumps(
                {
                    "type": "command",
                    "command": event.command,
                    "tool_name": event.tool_name,
                    "tool_call_id": event.tool_call_id,
                }
            )
        )
        if ctx.conv_logger:
            ctx.conv_logger.add_tool_call(
                event.tool_name, event.command, tool_call_id=event.tool_call_id
            )
