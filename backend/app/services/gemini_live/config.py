"""
Gemini Live 設定と定数。
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config.settings import settings

DEFAULT_INPUT_SAMPLE_RATE_HZ = 16000
DEFAULT_OUTPUT_SAMPLE_RATE_HZ = 24000


@dataclass(frozen=True)
class GeminiLiveConfig:
    model: str
    language: str = "ja"
    input_sample_rate_hz: int = DEFAULT_INPUT_SAMPLE_RATE_HZ
    output_sample_rate_hz: int = DEFAULT_OUTPUT_SAMPLE_RATE_HZ


def default_live_config(language: str = "ja") -> GeminiLiveConfig:
    # settingsのモデル名を流用しつつ、Live向けのモデルを後から差し替え可能にする
    model = getattr(settings, "GEMINI_LIVE_MODEL_NAME", "") or settings.GEMINI_MODEL_NAME
    return GeminiLiveConfig(model=model, language=language)
