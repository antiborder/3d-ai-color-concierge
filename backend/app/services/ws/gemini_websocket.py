from __future__ import annotations

import asyncio

from app.services.gemini_live import GeminiLiveSession
from app.services.gemini_live_types import (
    LiveAssistantTextEvent,
    LiveAudioChunk,
    LiveCommandEvent,
    LiveErrorEvent,
    LiveInterruptedEvent,
    LiveSuggestionPendingEvent,
    LiveTranscriptEvent,
)
from app.services.ws.abstract_websocket import AbstractWebSocket
from app.services.ws.listeners.gemini_outbound import (
    GeminiAssistantTextEventListener,
    GeminiAudioEventListener,
    GeminiCommandEventListener,
    GeminiErrorEventListener,
    GeminiInterruptedEventListener,
    GeminiSuggestionPendingEventListener,
    GeminiTranscriptEventListener,
)


class GeminiWebSocket(AbstractWebSocket):
    event_registry = {
        LiveAudioChunk: GeminiAudioEventListener,
        LiveTranscriptEvent: GeminiTranscriptEventListener,
        LiveAssistantTextEvent: GeminiAssistantTextEventListener,
        LiveErrorEvent: GeminiErrorEventListener,
        LiveCommandEvent: GeminiCommandEventListener,
        LiveInterruptedEvent: GeminiInterruptedEventListener,
        LiveSuggestionPendingEvent: GeminiSuggestionPendingEventListener,
    }

    def __init__(self, session: GeminiLiveSession) -> None:
        self._session = session

    async def receive_loop(self, queue: asyncio.Queue) -> None:
        async for event in self._session.events():
            await queue.put(event)

    async def send_bytes(self, data: bytes) -> None:
        await self._session.send_audio(data)

    async def send_text(self, text: str) -> None:
        await self._session.send_text(text)

    async def end_audio_stream(self) -> None:
        await self._session.end_audio_stream()

    def set_color_state(self, color: dict) -> None:
        self._session.set_current_color_state(color)

    def set_color_history(self, history: list[dict]) -> None:
        self._session.set_color_history(history)

    def take_pending_suggestions(self, token: int) -> list[dict]:
        return self._session.nav_state.take_pending(token)

    def clear_pending_suggestions(self) -> None:
        self._session.nav_state.clear_pending()

    def resolve_tool_result(self, tool_call_id: str, result: dict) -> None:
        future = self._session.pending_tool_futures.pop(tool_call_id, None)
        if future is not None and not future.done():
            future.set_result(result)
