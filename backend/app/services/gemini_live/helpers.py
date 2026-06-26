"""
Gemini Live 用の汎用ヘルパー関数。
"""

from __future__ import annotations

import base64
import inspect
import logging

from app.config.settings import settings

# NOTE: uvicorn のデフォルトlog_configでは root logger がINFOを出さないことがあるため、
# CloudWatchで確実に見える uvicorn.error ロガーへ寄せる。
logger = logging.getLogger("uvicorn.error")


def make_genai_client():
    """
    Create google-genai Client for Live API.

    NOTE: Some Live features (e.g. output_audio_transcription) may be available only on v1alpha.
    We allow configuring the API version via settings.GEMINI_LIVE_API_VERSION.
    """
    # 遅延import: Lambda環境やローカルでSDKが無い場合に分かりやすく落とす
    try:
        from google import genai  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "google-genai is required for Gemini Live. Install backend requirements (google-genai)."
        ) from e

    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    api_version = getattr(settings, "GEMINI_LIVE_API_VERSION", None)
    if api_version:
        if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
            try:
                logger.info(
                    "LIVE_CHAT_DEBUG google-genai http_options.api_version=%s",
                    api_version,
                )
            except Exception:
                pass
        try:
            from google.genai import types  # type: ignore

            HttpOptions = getattr(types, "HttpOptions", None)
            if HttpOptions is not None:
                try:
                    return genai.Client(
                        api_key=settings.GEMINI_API_KEY,
                        http_options=HttpOptions(api_version=api_version),
                    )
                except TypeError:
                    # Older client signatures might not accept http_options.
                    pass
        except Exception:
            pass

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def sdk_debug_enabled() -> bool:
    # 外部挙動に関係ない重い introspection ログを抑制するためのフラグ
    # Settings 経由で環境変数から上書き可能（GEMINI_LIVE_SDK_DEBUG=1）
    try:
        return bool(getattr(settings, "GEMINI_LIVE_SDK_DEBUG", False))
    except Exception:
        return False


def chat_debug_enabled() -> bool:
    """
    output_audio_transcription 等の「会話表示に関わる」受信内容を切り分けるためのログフラグ。
    例: GEMINI_LIVE_CHAT_DEBUG=1
    """
    try:
        return bool(getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False))
    except Exception:
        return False


def deep_find_keys(x, *, keys: tuple[str, ...], max_depth: int = 6, max_items: int = 200):
    """
    Debug helper: walk dict/list/pydantic-ish objects and report paths where certain keys appear.
    Best-effort and bounded to avoid huge logs.
    """
    found: list[tuple[str, object]] = []
    seen: set[int] = set()

    def _iter(obj, path: str, depth: int, budget: list[int]):
        if depth > max_depth or budget[0] <= 0:
            return
        try:
            oid = id(obj)
            if oid in seen:
                return
            seen.add(oid)
        except Exception:
            pass

        budget[0] -= 1

        if isinstance(obj, dict):
            for k, v in list(obj.items())[:50]:
                k_str = k if isinstance(k, str) else None
                if k_str and k_str in keys:
                    found.append((f"{path}.{k_str}" if path else k_str, v))
                _iter(
                    v,
                    f"{path}.{k_str}" if path else (k_str or "<?>"),
                    depth + 1,
                    budget,
                )
            return

        if isinstance(obj, (list, tuple)):
            for i, v in enumerate(list(obj)[:50]):
                _iter(v, f"{path}[{i}]", depth + 1, budget)
            return

        # pydantic / dataclass-ish: try model_dump / dict
        for attr in ("model_dump", "dict"):
            fn = getattr(obj, attr, None)
            if callable(fn):
                try:
                    d = fn()  # type: ignore[misc]
                    if isinstance(d, dict):
                        _iter(d, path, depth + 1, budget)
                        return
                except Exception:
                    pass

    _iter(x, "", 0, [max_items])
    return found


def b64_to_bytes(s: str) -> bytes | None:
    try:
        return base64.b64decode(s)
    except Exception:
        return None


def extract_blob_bytes(x) -> bytes | None:
    if x is None:
        return None
    if isinstance(x, (bytes, bytearray)):
        return bytes(x)
    if isinstance(x, dict):
        d = x.get("data")
        if isinstance(d, (bytes, bytearray)):
            return bytes(d)
        if isinstance(d, str):
            return b64_to_bytes(d)
        return None
    d = getattr(x, "data", None)
    if isinstance(d, (bytes, bytearray)):
        return bytes(d)
    if isinstance(d, str):
        return b64_to_bytes(d)
    return None


def extract_mime(x) -> str | None:
    if x is None:
        return None
    if isinstance(x, dict):
        mt = x.get("mime_type") or x.get("mimeType")
        return mt if isinstance(mt, str) else None
    mt = getattr(x, "mime_type", None) or getattr(x, "mimeType", None)
    return mt if isinstance(mt, str) else None


async def await_if_needed(x):
    if inspect.isawaitable(x):
        return await x
    return x


def err_str(e: Exception, limit: int = 240) -> str:
    s = str(e)
    if len(s) > limit:
        return s[:limit] + "…"
    return s
