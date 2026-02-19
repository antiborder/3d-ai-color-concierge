"""
Gemini Live 音声送信関連のヘルパー関数。
"""

from __future__ import annotations

import base64
import inspect
import logging
from typing import Optional

from app.services.gemini_live.helpers import await_if_needed, err_str

logger = logging.getLogger("uvicorn.error")


def build_audio_payloads(pcm_s16le_bytes: bytes) -> tuple[str, object, dict, dict]:
    """
    Build (mime, blob_payload, dict_bytes, dict_b64) for SDK calls.
    blob_payload may be None.
    """
    mime = "audio/pcm"
    blob_payload = None
    try:
        from google.genai import types  # type: ignore

        Blob = getattr(types, "Blob", None)
        if Blob is not None:
            blob_payload = Blob(data=pcm_s16le_bytes, mime_type=mime)
    except Exception:
        blob_payload = None

    dict_bytes = {"mime_type": mime, "data": pcm_s16le_bytes}
    dict_b64 = {"mime_type": mime, "data": base64.b64encode(pcm_s16le_bytes).decode("ascii")}
    return mime, blob_payload, dict_bytes, dict_b64


async def send_audio_via_realtime_input(
    live_session: object,
    blob_payload: object,
    dict_bytes: dict,
    allow_reconnect: bool = True,
) -> Optional[object]:
    """
    Try send_realtime_input(audio=...) then media=... as fallback.
    Returns:
      - None on success
      - "unavailable" if send_realtime_input is not callable
      - (audio_exc, media_exc) tuple if both routes failed
    """
    fn = getattr(live_session, "send_realtime_input", None)
    if not callable(fn):
        return "unavailable"
    try:
        await await_if_needed(fn(audio=blob_payload or dict_bytes))
        return None
    except Exception as e:
        # SDKドキュメント/実装例では audio ではなく media に音声Blobを入れる例もあるためフォールバック
        try:
            await await_if_needed(fn(media=blob_payload or dict_bytes))
            return None
        except Exception as e2:
            combined = f"{err_str(e)}; {err_str(e2)}"
            if allow_reconnect and (
                "keepalive ping timeout" in combined or "no close frame received" in combined
            ):
                # Reconnect logic will be handled by the caller
                return (e, e2)
            return (e, e2)


async def send_audio_via_typed_input(
    live_session: object,
    dict_bytes: dict,
    dict_b64: dict,
    pcm_s16le_bytes: bytes,
) -> Optional[Exception]:
    """
    Legacy fallback: try session.send(input=LiveClientRealtimeInput(...)).
    Returns None on success, otherwise the last exception.
    """
    send_attr = getattr(live_session, "send", None)
    send_fn = send_attr
    if not callable(send_fn):
        return Exception("send unavailable")
    last_err: Optional[Exception] = None
    try:
        from google.genai import types  # type: ignore

        rt = getattr(types, "LiveClientRealtimeInput", None)
        if rt is None:
            return Exception(
                "types.LiveClientRealtimeInput is missing in this google-genai version"
            )

        fields = getattr(rt, "model_fields", None)
        field_keys = set(fields.keys()) if isinstance(fields, dict) else set()
        rt_obj = None
        rt_err: Optional[Exception] = None

        # google-genai==0.8.0 のログでは LiveClientRealtimeInput_fields=["media_chunks"] が確定。
        # その場合は media_chunks=[chunk] の形で送る（chunk は型or dict）。
        if "media_chunks" in field_keys:
            chunk_type_names = [
                "LiveClientMediaChunk",
                "LiveClientMediaChunkDict",
                "LiveMediaChunk",
                "LiveMediaChunkDict",
            ]
            chunk_type = None
            for n in chunk_type_names:
                t = getattr(types, n, None)
                if t is not None:
                    chunk_type = t
                    break

            chunk_dict_candidates = [
                ("dict_b64", dict_b64),
                ("dict_bytes", dict_bytes),
            ]
            # 一部バージョンでは Blob が chunk として通る場合がある
            blob_payload = None
            try:
                Blob = getattr(types, "Blob", None)
                if Blob is not None:
                    blob_payload = Blob(data=pcm_s16le_bytes, mime_type=dict_bytes.get("mime_type"))
            except Exception:
                blob_payload = None
            if blob_payload is not None:
                chunk_dict_candidates.insert(0, ("Blob", blob_payload))

            for cname, cval in chunk_dict_candidates:
                try:
                    if chunk_type is not None and callable(chunk_type):
                        if isinstance(cval, dict):
                            chunk_obj = chunk_type(**cval)
                        else:
                            chunk_obj = cval
                    else:
                        chunk_obj = cval

                    rt_obj = rt(media_chunks=[chunk_obj])
                    rt_err = None
                    logger.info(
                        "GeminiLiveSession: constructed LiveClientRealtimeInput(media_chunks=...) using %s",
                        cname,
                    )
                    break
                except Exception as e:
                    rt_err = e
        else:
            # 旧/別版: audio/media のどちらか
            field_candidates: list[str] = []
            if "audio" in field_keys:
                field_candidates.append("audio")
            if "media" in field_keys:
                field_candidates.append("media")
            if not field_candidates:
                field_candidates = ["audio", "media"]

            value_candidates = [
                ("dict_bytes", dict_bytes),
                ("dict_b64", dict_b64),
                ("raw_bytes", pcm_s16le_bytes),
            ]
            blob_payload = None
            try:
                Blob = getattr(types, "Blob", None)
                if Blob is not None:
                    blob_payload = Blob(data=pcm_s16le_bytes, mime_type=dict_bytes.get("mime_type"))
            except Exception:
                blob_payload = None
            if blob_payload is not None:
                value_candidates.insert(0, ("Blob", blob_payload))

            for key in field_candidates:
                for _, val in value_candidates:
                    if val is None:
                        continue
                    try:
                        rt_obj = rt(**{key: val})
                        rt_err = None
                        break
                    except Exception as e:
                        rt_err = e
                if rt_obj is not None:
                    break

        if rt_obj is None:
            return Exception(f"cannot construct LiveClientRealtimeInput: {err_str(rt_err)}")

        # send() のシグネチャに合わせて渡す kwargs を絞る
        try:
            sig = inspect.signature(send_fn)
            params = set(sig.parameters.keys())
        except Exception:
            params = {"input", "end_of_turn"}

        for kwargs in ({"input": rt_obj}, {"input": rt_obj, "end_of_turn": False}):
            filtered = {k: v for k, v in kwargs.items() if k in params}
            try:
                await await_if_needed(send_fn(**filtered))
                return None
            except TypeError as e:
                last_err = e
            except Exception as e:
                last_err = e
                break
        return last_err or Exception("send(input=...) failed")
    except Exception as e:
        return e
