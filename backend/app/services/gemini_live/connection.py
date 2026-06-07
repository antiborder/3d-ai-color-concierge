"""
Gemini Live 接続管理のヘルパー関数。
"""

from __future__ import annotations

import inspect
import logging
from typing import Any

from app.services.gemini_live.config import GeminiLiveConfig
from app.services.gemini_live.tools import live_system_instruction, live_tools

logger = logging.getLogger("uvicorn.error")


def build_live_connect_config(cfg: GeminiLiveConfig) -> dict[str, Any]:
    """
    Build connect config for Live session.
    Note: google-genai versions differ on accepted keys for LiveConnectConfig.
    """
    config_raw: dict[str, Any] = {
        "response_modalities": ["AUDIO"],
        "system_instruction": live_system_instruction(cfg.language),
        "tools": live_tools(),
        "speech_config": {
            "voice_config": {
                "prebuilt_voice_config": {
                    "voice_name": "Zephyr"
                }
            }
        },
        # Ask the server to generate an automatic transcript for the model's output audio.
        # This gives "audio-consistent" text without requiring response_modalities=["TEXT"].
        "output_audio_transcription": {},
        # Ask the server to generate an automatic transcript for the user's INPUT audio.
        # Field name differs by API/SDK version; we include both and let LiveConnectConfig filtering drop unsupported keys.
        "input_audio_transcription": {},
        "input_transcription": {},
        # NOTE: language/input_audio_format/output_audio_format は 1.63.0 では extra_forbidden のため、
        # LiveConnectConfig.model_fields を見て許可されているキーへマップする。
        "language": cfg.language,
        "input_audio_format": {
            "encoding": "PCM_S16LE",
            "sample_rate_hz": cfg.input_sample_rate_hz,
        },
        "output_audio_format": {
            "encoding": "PCM_S16LE",
            "sample_rate_hz": cfg.output_sample_rate_hz,
        },
    }

    config_for_connect = config_raw
    try:
        from google.genai import types  # type: ignore

        LiveConnectConfig = getattr(types, "LiveConnectConfig", None)
        if LiveConnectConfig is not None:
            try:
                config_for_connect = LiveConnectConfig(**config_raw)
            except Exception as e:
                allowed = set(getattr(LiveConnectConfig, "model_fields", {}).keys())
                filtered = {k: v for k, v in config_raw.items() if k in allowed}

                # Map audio format settings to newer config keys if present.
                # We do this by inspecting candidate model fields and only keeping known keys.
                def _build_typed_or_dict(model_cls, desired: dict) -> object:
                    try:
                        fields = getattr(model_cls, "model_fields", None)
                        keys = set(fields.keys()) if isinstance(fields, dict) else set()
                        if keys:
                            desired = {k: v for k, v in desired.items() if k in keys}
                    except Exception:
                        pass
                    try:
                        return model_cls(**desired)
                    except Exception:
                        return desired

                # Try realtime_input_config / realtime_output_config if supported by this SDK.
                if "realtime_input_config" in allowed:
                    ric_cls = getattr(types, "RealtimeInputConfig", None)
                    desired = {
                        "mime_type": "audio/pcm",
                        "media_type": "audio/pcm",
                        "encoding": "PCM_S16LE",
                        "sample_rate_hz": cfg.input_sample_rate_hz,
                    }
                    filtered["realtime_input_config"] = (
                        _build_typed_or_dict(ric_cls, desired) if ric_cls is not None else desired
                    )

                if "realtime_output_config" in allowed:
                    roc_cls = getattr(types, "RealtimeOutputConfig", None)
                    desired = {
                        "mime_type": "audio/pcm",
                        "media_type": "audio/pcm",
                        "encoding": "PCM_S16LE",
                        "sample_rate_hz": cfg.output_sample_rate_hz,
                    }
                    filtered["realtime_output_config"] = (
                        _build_typed_or_dict(roc_cls, desired) if roc_cls is not None else desired
                    )

                if "response_modalities" not in allowed and "generation_config" in allowed:
                    gen_cfg = filtered.get("generation_config")
                    if not isinstance(gen_cfg, dict):
                        gen_cfg = {}
                    gen_cfg.setdefault("response_modalities", ["AUDIO"])
                    filtered["generation_config"] = gen_cfg

                dropped = sorted([k for k in config_raw.keys() if k not in filtered])
                logger.info(
                    "LiveConnectConfig rejected some keys; dropping=%s err=%s",
                    dropped,
                    str(e),
                )
                config_for_connect = LiveConnectConfig(**filtered)
    except Exception as e:
        logger.info("Failed to import google.genai.types.LiveConnectConfig: %s", str(e))

    return config_for_connect


async def connect_live_session(client: Any, model: str, config: Any) -> tuple[Any, Any]:
    """
    Connect to Gemini Live session.
    Returns (live_session, live_context_manager).
    live_context_manager may be None if the session is returned directly.
    """
    conn = client.aio.live.connect(  # type: ignore[attr-defined]
        model=model,
        config=config,
    )
    if inspect.isawaitable(conn):
        live = await conn
        return live, None
    else:
        live_cm = conn
        live = await live_cm.__aenter__()
        return live, live_cm


async def close_live_session(live: Any, live_cm: Any) -> None:
    """
    Close Live session. Best-effort approach as SDK versions differ.
    """
    if live_cm is not None:
        try:
            await live_cm.__aexit__(None, None, None)
        except Exception:
            pass
    elif live:
        try:
            close_fn = getattr(live, "close", None)
            if callable(close_fn):
                maybe = close_fn()
                if inspect.isawaitable(maybe):
                    await maybe
        except Exception:
            pass
