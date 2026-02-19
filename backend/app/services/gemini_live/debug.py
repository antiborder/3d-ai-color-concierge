"""
Gemini Live SDK デバッグログ用のヘルパー関数。
"""

from __future__ import annotations

import inspect
import json
import logging

from app.services.gemini_live.helpers import sdk_debug_enabled

logger = logging.getLogger("uvicorn.error")


async def log_sdk_debug_info(live_session: object) -> None:
    """
    Log SDK debug information once per session.
    This helps identify SDK version differences in production.
    """
    if not sdk_debug_enabled():
        return

    try:
        import importlib.metadata as md

        genai_ver = md.version("google-genai")
    except Exception:
        genai_ver = "unknown"

    try:
        import google.genai.live as live  # type: ignore

        async_session = getattr(live, "AsyncSession", None)
        send_rt = getattr(async_session, "send_realtime_input", None) if async_session else None
        send = getattr(async_session, "send", None) if async_session else None

        def _sig(fn):
            try:
                return str(inspect.signature(fn))
            except Exception:
                return "unknown"

        def _srcfile(obj):
            try:
                return inspect.getsourcefile(obj) or inspect.getfile(obj)
            except Exception:
                return "unknown"

        live_debug = {
            "google_genai_version": genai_ver,
            "live_session_type": type(live_session).__name__,
            "live_session_has_send_realtime_input": bool(
                getattr(live_session, "send_realtime_input", None)
            ),
            "live_session_has_send": bool(getattr(live_session, "send", None)),
            "live_session_send_callable": callable(getattr(live_session, "send", None)),
            "AsyncSession_src": _srcfile(async_session) if async_session else "missing",
            "AsyncSession.send_realtime_input_sig": _sig(send_rt) if send_rt else "missing",
            "AsyncSession.send_sig": _sig(send) if send else "missing",
            "live_session_sendish_methods": sorted(
                [
                    n
                    for n in dir(live_session)
                    if ("send" in n or "realtime" in n) and not n.startswith("_")
                ]
            )[:60],
        }
        logger.info("google-genai live SDK debug %s", json.dumps(live_debug, ensure_ascii=False))

        # types側に realtime input 型があるかもログ
        try:
            from google.genai import types  # type: ignore

            cand = [n for n in dir(types) if "Realtime" in n or "realtime" in n]
            types_debug = {
                "realtime_type_candidates": cand[:80],
                "has_LiveClientRealtimeInput": hasattr(types, "LiveClientRealtimeInput"),
                "types_src": _srcfile(types),
            }
            if hasattr(types, "LiveClientRealtimeInput"):
                try:
                    rt_cls = getattr(types, "LiveClientRealtimeInput")
                    fields = getattr(rt_cls, "model_fields", None)
                    if isinstance(fields, dict):
                        types_debug["LiveClientRealtimeInput_fields"] = sorted(list(fields.keys()))
                        # 期待する型（Pydantic v2）を短く出す
                        field_types: dict[str, str] = {}
                        for k, f in list(fields.items())[:30]:
                            try:
                                ann = getattr(f, "annotation", None)
                                field_types[k] = getattr(ann, "__name__", repr(ann))
                            except Exception:
                                field_types[k] = "unknown"
                        types_debug["LiveClientRealtimeInput_field_types"] = field_types

                    # json schemaから "audio/media" あたりの期待形を薄く出す（大きすぎる場合は丸める）
                    try:
                        schema = rt_cls.model_json_schema()  # type: ignore[attr-defined]
                        props = schema.get("properties") if isinstance(schema, dict) else None
                        if isinstance(props, dict):
                            slim = {}
                            for k in (
                                "media_chunks",
                                "audio",
                                "media",
                                "video",
                                "text",
                                "activity_start",
                                "activity_end",
                            ):
                                if k in props:
                                    slim[k] = props[k]
                            types_debug["LiveClientRealtimeInput_schema_props"] = slim
                    except Exception:
                        pass
                except Exception:
                    pass
            logger.info("google-genai types debug %s", json.dumps(types_debug, ensure_ascii=False))
        except Exception as e:
            logger.info("google-genai types debug failed %s", str(e))
    except Exception as e:
        logger.info(
            "google-genai live debug failed %s",
            json.dumps({"err": str(e), "google_genai_version": genai_ver}, ensure_ascii=False),
        )
