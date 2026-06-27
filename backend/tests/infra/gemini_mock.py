from __future__ import annotations

from typing import Any

from app.services.gemini_live.session import GeminiLiveSession
from app.services.gemini_live_types import LiveEvent


class GeminiMock:
    """
    GeminiLiveSession をモックし、シナリオで指定したイベントを返す。

    使い方:
        mock = GeminiMock().will_respond(LiveAudioChunk(...), LiveCommandEvent(...))
        mock.patch(monkeypatch)
    """

    def __init__(self) -> None:
        self._events: list[LiveEvent] = []
        self.sent_audio_chunks: list[bytes] = []
        self.sent_texts: list[str] = []

    def will_respond(self, *events: LiveEvent) -> "GeminiMock":
        self._events = list(events)
        return self

    def patch(self, monkeypatch: Any) -> None:
        captured = self

        # __aenter__: SDK への実接続をスキップ
        async def fake_aenter(self_s: GeminiLiveSession) -> GeminiLiveSession:
            self_s._closed = False
            self_s._live = None
            self_s._live_cm = None
            self_s._recv_task = None
            self_s._live_ended = False
            return self_s

        # __aexit__: self._live が None でも close() が通るようにする
        async def fake_aexit(self_s: GeminiLiveSession, *args: Any) -> None:
            self_s._closed = True

        # events(): スクリプトしたイベントを順番に yield して終了
        async def fake_events(self_s: GeminiLiveSession):  # type: ignore[return]
            for ev in captured._events:
                yield ev

        # 送信系: 呼び出しを記録するだけ
        async def fake_send_audio(self_s: GeminiLiveSession, data: bytes) -> None:
            captured.sent_audio_chunks.append(data)

        async def fake_send_text(self_s: GeminiLiveSession, text: str) -> None:
            captured.sent_texts.append(text)

        async def fake_end_audio_stream(self_s: GeminiLiveSession) -> None:
            pass

        monkeypatch.setattr(GeminiLiveSession, "__aenter__", fake_aenter)
        monkeypatch.setattr(GeminiLiveSession, "__aexit__", fake_aexit)
        monkeypatch.setattr(GeminiLiveSession, "events", fake_events)
        monkeypatch.setattr(GeminiLiveSession, "send_audio", fake_send_audio)
        monkeypatch.setattr(GeminiLiveSession, "send_text", fake_send_text)
        monkeypatch.setattr(GeminiLiveSession, "end_audio_stream", fake_end_audio_stream)
