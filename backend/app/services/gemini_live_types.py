"""
Gemini Live（Multimodal Live API）連携で使う、最小限の型・イベント定義。

前提（Google公式ドキュメントに沿った一般的な前提）:
- 入力音声: PCM 16bit little-endian, 16kHz, mono
- 出力音声: PCM 16bit little-endian, 24kHz, mono

※ 実際のモデル/SDKの仕様変更に備え、アプリ内プロトコルをここに集約する。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

AudioFormat = Literal["pcm_s16le"]


@dataclass(frozen=True)
class LiveAudioChunk:
    """音声チャンク（生bytes）。"""

    direction: Literal["in", "out"]
    data: bytes
    sample_rate_hz: int
    format: AudioFormat = "pcm_s16le"


@dataclass(frozen=True)
class LiveTranscriptEvent:
    """ASRテキスト（途中/確定）。"""

    text: str
    is_final: bool = False
    language: str | None = None
    segment_id: str | None = None


@dataclass(frozen=True)
class LiveAssistantTextEvent:
    """アシスタントのテキスト（音声とは別チャンネルで来る場合用）。"""

    text: str
    # Where this assistant text came from.
    # - "output_audio_transcription": server-generated transcript of the model's OUTPUT audio
    # - "output_transcription": server-generated transcript of the model's OUTPUT audio (observed in v1alpha)
    # - "text_part": plain text parts in the model turn (fallback)
    source: Literal["output_audio_transcription", "output_transcription", "text_part"] | None = None
    # Segment identifier for grouping streaming updates into one bubble.
    segment_id: str | None = None
    # Whether this text is the final (completed) transcript for the segment.
    is_final: bool | None = None


@dataclass(frozen=True)
class LiveErrorEvent:
    """Liveセッションのエラー。"""

    message: str
    code: str | None = None


@dataclass(frozen=True)
class LiveCommandEvent:
    """
    Gemini Live tool_call から生成された「UIへ適用すべきコマンド」イベント。
    """

    command: dict[str, Any]
    tool_name: str | None = None
    tool_call_id: str | None = None


@dataclass(frozen=True)
class LiveInterruptedEvent:
    """Gemini が応答生成を中断した（ユーザーの割り込み検知）。"""


LiveEvent = (
    LiveAudioChunk
    | LiveTranscriptEvent
    | LiveAssistantTextEvent
    | LiveCommandEvent
    | LiveErrorEvent
    | LiveInterruptedEvent
)
