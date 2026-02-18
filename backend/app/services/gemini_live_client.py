"""
Gemini Live API の最小ラッパ。

このリポジトリでは現状 `google-generativeai`（テキスト生成中心）を使っているが、
Live（音声ストリーミング）には `google-genai` SDK が適するため、こちらを追加で使用する。

注意:
- SDK/APIの変更が入りやすい領域なので、アプリ側はこのラッパ越しに扱う。
- ここは「スパイクで仕様を固める」ための土台。実運用で必要なオプションは後続TODOで詰める。
"""

from __future__ import annotations

import asyncio
import base64
import inspect
import json
import logging
from dataclasses import dataclass
from typing import AsyncIterator, Optional

from app.config.settings import settings
from app.services.gemini_live_types import (
    LiveAssistantTextEvent,
    LiveAudioChunk,
    LiveCommandEvent,
    LiveErrorEvent,
    LiveEvent,
    LiveTranscriptEvent,
)

# NOTE: uvicorn のデフォルトlog_configでは root logger がINFOを出さないことがあるため、
# CloudWatchで確実に見える uvicorn.error ロガーへ寄せる。
logger = logging.getLogger("uvicorn.error")

DEFAULT_INPUT_SAMPLE_RATE_HZ = 16000
DEFAULT_OUTPUT_SAMPLE_RATE_HZ = 24000


def _sdk_debug_enabled() -> bool:
    # 外部挙動に関係ない重い introspection ログを抑制するためのフラグ
    # Settings 経由で環境変数から上書き可能（GEMINI_LIVE_SDK_DEBUG=1）
    try:
        return bool(getattr(settings, "GEMINI_LIVE_SDK_DEBUG", False))
    except Exception:
        return False


def _b64_to_bytes(s: str) -> Optional[bytes]:
    try:
        return base64.b64decode(s)
    except Exception:
        return None


def _extract_blob_bytes(x) -> Optional[bytes]:
    if x is None:
        return None
    if isinstance(x, (bytes, bytearray)):
        return bytes(x)
    if isinstance(x, dict):
        d = x.get("data")
        if isinstance(d, (bytes, bytearray)):
            return bytes(d)
        if isinstance(d, str):
            return _b64_to_bytes(d)
        return None
    d = getattr(x, "data", None)
    if isinstance(d, (bytes, bytearray)):
        return bytes(d)
    if isinstance(d, str):
        return _b64_to_bytes(d)
    return None


def _extract_mime(x) -> Optional[str]:
    if x is None:
        return None
    if isinstance(x, dict):
        mt = x.get("mime_type") or x.get("mimeType")
        return mt if isinstance(mt, str) else None
    mt = getattr(x, "mime_type", None) or getattr(x, "mimeType", None)
    return mt if isinstance(mt, str) else None


async def _await_if_needed(x):
    if inspect.isawaitable(x):
        return await x
    return x


def _err_str(e: Exception, limit: int = 240) -> str:
    s = str(e)
    if len(s) > limit:
        return s[:limit] + "…"
    return s


def _tool_call_function_calls(tool_call) -> list:
    """
    tool_call から function_calls を取り出す（SDK差分を吸収）。
    """
    if tool_call is None:
        return []
    function_calls = getattr(tool_call, "function_calls", None) or getattr(tool_call, "functionCalls", None)
    if function_calls is None and isinstance(tool_call, dict):
        function_calls = tool_call.get("function_calls") or tool_call.get("functionCalls")
    if not function_calls:
        return []
    # SDKにより tuple 等もあり得るが、とにかく iterable を list 化する
    try:
        return list(function_calls)
    except Exception:
        return []


def _tool_call_to_frontend_command(name: str, args: dict) -> dict:
    """
    tool call args -> frontend command schema へ変換。
    外部挙動を変えないため、現行のキー/型変換に合わせる。
    """
    cmd: dict = {"action": name, "parameters": {}}
    if name == "SELECT_COLOR":
        cmd["parameters"] = {
            "color": {
                "r": int(args.get("r", 0)),
                "g": int(args.get("g", 0)),
                "b": int(args.get("b", 0)),
            }
        }
    elif name == "SET_COLOR":
        for k in ("r", "g", "b"):
            if k in args:
                cmd["parameters"][k] = int(args[k])
    elif name == "ADJUST_VALUE":
        cmd["parameters"] = {
            "property": args.get("property"),
            "direction": args.get("direction"),
        }
        if "amount" in args:
            cmd["parameters"]["amount"] = args.get("amount")
    elif name == "CHANGE_SHAPE":
        cmd["parameters"] = {"colorSpace": args.get("colorSpace")}
    elif name == "TOGGLE_LABEL":
        cmd["parameters"] = {"visible": args.get("visible")}
    else:
        cmd["parameters"] = args
    return cmd


def _extract_text_from_transcription_obj(x) -> Optional[str]:
    """
    受信メッセージ内の「書き起こし」オブジェクトからテキストを取り出すためのbest-effort。
    `output_audio_transcription` 由来の構造は SDK/モデルで変わり得るため、落ちない抽出を優先する。
    """
    if x is None:
        return None
    if isinstance(x, str):
        return x.strip() or None
    if isinstance(x, dict):
        # common shapes
        for k in ("text", "transcript", "transcription"):
            v = x.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        # nested: {"transcript": {"text": "..."}}
        v2 = x.get("transcript")
        if isinstance(v2, dict):
            t = v2.get("text")
            if isinstance(t, str) and t.strip():
                return t.strip()
        return None
    # pydantic/model objects
    t = getattr(x, "text", None)
    if isinstance(t, str) and t.strip():
        return t.strip()
    tr = getattr(x, "transcript", None)
    if isinstance(tr, str) and tr.strip():
        return tr.strip()
    tr2 = getattr(x, "transcription", None)
    if isinstance(tr2, str) and tr2.strip():
        return tr2.strip()
    tr_obj = getattr(x, "transcript", None)
    if tr_obj is not None:
        t2 = getattr(tr_obj, "text", None)
        if isinstance(t2, str) and t2.strip():
            return t2.strip()
    return None


def _live_tools() -> list[dict]:
    """
    Gemini Live tools (function_declarations).
    We keep the schema minimal and map directly to the frontend's command model.
    """
    # NOTE: google-genai expects the "tools" structure to be a list of tool entries.
    # The most common form is:
    #   [{"function_declarations": [{"name": "...", "parameters": {...}}, ...]}]
    return [
        {
            "function_declarations": [
                {
                    "name": "SELECT_COLOR",
                    "description": "Select a specific RGB color.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "r": {"type": "integer", "minimum": 0, "maximum": 255},
                            "g": {"type": "integer", "minimum": 0, "maximum": 255},
                            "b": {"type": "integer", "minimum": 0, "maximum": 255},
                        },
                        "required": ["r", "g", "b"],
                    },
                },
                {
                    "name": "SET_COLOR",
                    "description": "Set one or more RGB channels directly (r/g/b).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "r": {"type": "integer", "minimum": 0, "maximum": 255},
                            "g": {"type": "integer", "minimum": 0, "maximum": 255},
                            "b": {"type": "integer", "minimum": 0, "maximum": 255},
                        },
                    },
                },
                {
                    "name": "ADJUST_VALUE",
                    "description": "Adjust brightness/saturation/hue.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "property": {
                                "type": "string",
                                "enum": ["brightness", "saturation", "hue"],
                            },
                            "direction": {"type": "string", "enum": ["up", "down"]},
                            "amount": {"type": "number", "minimum": 0},
                        },
                        "required": ["property", "direction"],
                    },
                },
                {
                    "name": "CHANGE_SHAPE",
                    "description": "Switch color space / UI shape (RGB/CMYK/HSL/HSV).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "colorSpace": {
                                "type": "string",
                                "enum": ["RGB", "CMYK", "HSL", "HSV"],
                            }
                        },
                        "required": ["colorSpace"],
                    },
                },
                {
                    "name": "TOGGLE_LABEL",
                    "description": "Toggle label visibility.",
                    "parameters": {
                        "type": "object",
                        "properties": {"visible": {"type": "boolean"}},
                    },
                },
            ]
        }
    ]


def _live_system_instruction(language: str) -> dict:
    """
    Provide role + tool-usage instruction to Gemini Live.
    We intentionally avoid the old 'JSON-only response' constraint here and instead
    rely on tool calls for UI actions.
    """
    if language == "en":
        text = (
            "You are ai-color-concierge for a 3D color picker.\n"
            "Your job is to help the user change colors and UI state, and also chat naturally.\n"
            "\n"
            "## Tool usage rules\n"
            "- If the user asks to change color / adjust brightness/saturation/hue / change color space / toggle labels, you MUST use a tool call.\n"
            "- Available tools: SELECT_COLOR, SET_COLOR, ADJUST_VALUE, CHANGE_SHAPE, TOGGLE_LABEL.\n"
            "- After making the tool call, also respond naturally (short) in English (audio response).\n"
            "- If it is not a UI action, respond normally with suggestions and explanations.\n"
        )
    else:
        text = (
            "あなたは3Dカラーピッカーの ai-color-concierge です。\n"
            "ユーザーの意図を理解し、色やUI状態を音声で手早く操作できるように支援しつつ、自然に会話してください。\n"
            "\n"
            "## tool call ルール\n"
            "- ユーザーの発話がUI操作（色変更/明度・彩度・色相調整/色空間変更/ラベル表示切替）に該当する場合は、必ず tool call を使ってください。\n"
            "- 利用可能な tool: SELECT_COLOR, SET_COLOR, ADJUST_VALUE, CHANGE_SHAPE, TOGGLE_LABEL。\n"
            "- tool call を出した後も、会話として自然な短い返答を日本語で話してください（音声応答）。\n"
            "- UI操作に該当しない場合は、通常の会話として色の提案や説明をしてください。\n"
        )
    # LiveConnectConfig.system_instruction は Content として解釈される（dictでもOK）
    return {"role": "system", "parts": [{"text": text}]}


@dataclass(frozen=True)
class GeminiLiveConfig:
    model: str
    language: str = "ja"
    input_sample_rate_hz: int = DEFAULT_INPUT_SAMPLE_RATE_HZ
    output_sample_rate_hz: int = DEFAULT_OUTPUT_SAMPLE_RATE_HZ


class GeminiLiveSession:
    """
    1クライアント接続（=1会話）に対応するLiveセッション。

    実装方針:
    - send_audio() で入力音声を送る
    - events() で出力イベント（音声/ASR/テキスト等）を受ける
    """

    def __init__(self, cfg: GeminiLiveConfig):
        self._cfg = cfg
        self._closed = False
        self._live_ended = False

        # 実装の都合上、SDK依存の受信は内部タスクでqueueに流す
        self._event_q: "asyncio.Queue[LiveEvent]" = asyncio.Queue()
        self._recv_task: Optional[asyncio.Task[None]] = None

        # google-genai の live 接続オブジェクト（型はSDKに依存するためAny相当）
        self._live = None
        self._live_cm = None  # async context manager (SDKによってはconnectがこちらを返す)
        self._did_log_sdk_debug = False

    async def __aenter__(self) -> "GeminiLiveSession":
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        # 遅延import: Lambda環境やローカルでSDKが無い場合に分かりやすく落とす
        try:
            # google-genai SDK
            from google import genai  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "google-genai is required for Gemini Live. "
                "Install backend requirements (google-genai)."
            ) from e

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        await self._open_live(client)

        # 1回だけSDKの実体をログ出し（ECS上のバージョン差異を確定させる）
        # NOTE: 量が多く、通常運用ではノイズになるためフラグで抑制する
        if _sdk_debug_enabled() and (not self._did_log_sdk_debug):
            self._did_log_sdk_debug = True
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
                    "live_session_type": type(self._live).__name__,
                    "live_session_has_send_realtime_input": bool(
                        getattr(self._live, "send_realtime_input", None)
                    ),
                    "live_session_has_send": bool(getattr(self._live, "send", None)),
                    "live_session_send_callable": callable(getattr(self._live, "send", None)),
                    "AsyncSession_src": _srcfile(async_session) if async_session else "missing",
                    "AsyncSession.send_realtime_input_sig": _sig(send_rt) if send_rt else "missing",
                    "AsyncSession.send_sig": _sig(send) if send else "missing",
                    "live_session_sendish_methods": sorted(
                        [
                            n
                            for n in dir(self._live)
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
                logger.info("google-genai live debug failed %s", json.dumps({"err": str(e), "google_genai_version": genai_ver}, ensure_ascii=False))

        self._recv_task = asyncio.create_task(self._recv_loop())
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.close()

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True

        if self._recv_task:
            self._recv_task.cancel()
            try:
                await self._recv_task
            except Exception:
                pass

        await self._close_live()

    async def _close_live(self) -> None:
        # SDKによって close の方法が違うため、best-effort に閉じる
        if self._live_cm is not None:
            try:
                await self._live_cm.__aexit__(None, None, None)
            except Exception:
                pass
        elif self._live:
            try:
                close_fn = getattr(self._live, "close", None)
                if callable(close_fn):
                    maybe = close_fn()
                    if inspect.isawaitable(maybe):
                        await maybe
            except Exception:
                pass
        self._live = None
        self._live_cm = None

    async def _open_live(self, client) -> None:
        """
        Establish a Live session. Factored out so send_audio() can reconnect if the
        Gemini WS dies (e.g. keepalive ping timeout) before the first audio arrives.
        """
        self._live_ended = False

        # Build connect config. Note: google-genai versions differ on accepted keys for LiveConnectConfig.
        config_raw: dict = {
            "response_modalities": ["AUDIO"],
            "system_instruction": _live_system_instruction(self._cfg.language),
            "tools": _live_tools(),
            # Ask the server to generate an automatic transcript for the model's output audio.
            # This gives "audio-consistent" text without requiring response_modalities=["TEXT"].
            "output_audio_transcription": {},
            # NOTE: language/input_audio_format/output_audio_format は 1.63.0 では extra_forbidden のため、
            # LiveConnectConfig.model_fields を見て許可されているキーへマップする。
            "language": self._cfg.language,
            "input_audio_format": {
                "encoding": "PCM_S16LE",
                "sample_rate_hz": self._cfg.input_sample_rate_hz,
            },
            "output_audio_format": {
                "encoding": "PCM_S16LE",
                "sample_rate_hz": self._cfg.output_sample_rate_hz,
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
                            "sample_rate_hz": self._cfg.input_sample_rate_hz,
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
                            "sample_rate_hz": self._cfg.output_sample_rate_hz,
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

        conn = client.aio.live.connect(  # type: ignore[attr-defined]
            model=self._cfg.model,
            config=config_for_connect,
        )
        if inspect.isawaitable(conn):
            self._live = await conn
            self._live_cm = None
        else:
            self._live_cm = conn
            self._live = await self._live_cm.__aenter__()

    async def _ensure_live_connected(self) -> bool:
        """
        Ensure self._live is connected.
        Returns True if connected, False if an error was enqueued.
        """
        if self._closed:
            return False
        if self._live and (not self._live_ended):
            return True
        # If Gemini closed the session due to inactivity, reconnect on first audio.
        try:
            from google import genai  # type: ignore

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            await self._close_live()
            await self._open_live(client)
            if self._recv_task is None or self._recv_task.done():
                self._recv_task = asyncio.create_task(self._recv_loop())
            return True
        except Exception as e:
            await self._event_q.put(
                LiveErrorEvent(message=f"Failed to reconnect Gemini Live session: {e}")
            )
            return False

    def _build_audio_payloads(self, pcm_s16le_bytes: bytes) -> tuple[str, object, dict, dict]:
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

    async def _send_audio_via_send_realtime_input(
        self, blob_payload, dict_bytes: dict, allow_reconnect: bool = True
    ) -> Optional[object]:
        """
        Try send_realtime_input(audio=...) then media=... as fallback.
        Returns:
          - None on success
          - "unavailable" if send_realtime_input is not callable
          - (audio_exc, media_exc) tuple if both routes failed
        """
        fn = getattr(self._live, "send_realtime_input", None)
        if not callable(fn):
            return "unavailable"
        try:
            await _await_if_needed(fn(audio=blob_payload or dict_bytes))
            return None
        except Exception as e:
            # SDKドキュメント/実装例では audio ではなく media に音声Blobを入れる例もあるためフォールバック
            try:
                await _await_if_needed(fn(media=blob_payload or dict_bytes))
                return None
            except Exception as e2:
                combined = f"{_err_str(e)}; {_err_str(e2)}"
                if allow_reconnect and (
                    "keepalive ping timeout" in combined or "no close frame received" in combined
                ):
                    # If the underlying WS is dead (keepalive ping timeout), do one reconnect + retry.
                    try:
                        from google import genai  # type: ignore

                        client = genai.Client(api_key=settings.GEMINI_API_KEY)
                        await self._close_live()
                        await self._open_live(client)
                        if self._recv_task is None or self._recv_task.done():
                            self._recv_task = asyncio.create_task(self._recv_loop())
                        fn2 = getattr(self._live, "send_realtime_input", None)
                        if callable(fn2):
                            await _await_if_needed(fn2(audio=blob_payload or dict_bytes))
                            return None
                    except Exception:
                        pass
                return (e, e2)

    async def _send_audio_via_send_typed_input(self, dict_bytes: dict, dict_b64: dict, pcm_s16le_bytes: bytes) -> Optional[Exception]:
        """
        Legacy fallback: try session.send(input=LiveClientRealtimeInput(...)).
        Returns None on success, otherwise the last exception.
        """
        send_attr = getattr(self._live, "send", None)
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
                return Exception(f"cannot construct LiveClientRealtimeInput: {_err_str(rt_err)}")

            # send() のシグネチャに合わせて渡す kwargs を絞る
            try:
                sig = inspect.signature(send_fn)
                params = set(sig.parameters.keys())
            except Exception:
                params = {"input", "end_of_turn"}

            for kwargs in ({"input": rt_obj}, {"input": rt_obj, "end_of_turn": False}):
                filtered = {k: v for k, v in kwargs.items() if k in params}
                try:
                    await _await_if_needed(send_fn(**filtered))
                    return None
                except TypeError as e:
                    last_err = e
                except Exception as e:
                    last_err = e
                    break
            return last_err or Exception("send(input=...) failed")
        except Exception as e:
            return e

    async def send_audio(self, pcm_s16le_bytes: bytes) -> None:
        if not await self._ensure_live_connected():
            return
        # SDK依存: 入力音声の送信方法はバージョン差が大きいので、複数の形を順に試す。
        # 代表例:
        # - session.send_realtime_input(audio=Blob(...)) もしくは media=Blob(...)
        # - session.send({...}) / session.send(input_audio=...)
        # NOTE: google-genai 1.63.0 の例は mime_type="audio/pcm" が基本。
        # サンプルレート等は connect config 側で指定する（realtime_input_config 等）。
        _, blob_payload, dict_bytes, dict_b64 = self._build_audio_payloads(pcm_s16le_bytes)

        # 1) send_realtime_input(audio=...) が使えるならそれを優先する。
        #    SDKソース上は `audio` も `media` も1つだけ指定可能（len(kwargs)==1）。
        rt_result = await self._send_audio_via_send_realtime_input(blob_payload, dict_bytes)
        if rt_result is None:
            return

        # audio/media の2経路が失敗した場合は理由を返して終了する。（従来挙動）
        # NOTE: send_realtime_input が無いケース（unavailable）のみ、続けて send(input=...) を試す。
        if rt_result != "unavailable":
            try:
                e, e2 = rt_result  # type: ignore[misc]
            except Exception:
                e, e2 = rt_result, rt_result
            msg = (
                f"Failed to send audio: audio=... -> {_err_str(e)}; "
                f"media=... -> {_err_str(e2)}"
            )
            await self._event_q.put(LiveErrorEvent(message=msg))
            return

        # 2) send_realtime_input が無いSDK向け: send(input=...) を試す（typedのみ）
        err2 = await self._send_audio_via_send_typed_input(dict_bytes, dict_b64, pcm_s16le_bytes)
        if err2 is None:
            return

        # typedが無いなら、SDK差分なので無理にdictを投げずに切り分け情報を返す（従来挙動に合わせる）
        if "LiveClientRealtimeInput is missing" in str(err2) or "missing in this google-genai version" in str(err2):
            await self._event_q.put(
                LiveErrorEvent(
                    message=(
                        "Failed to send audio: send_realtime_input is unavailable and "
                        "types.LiveClientRealtimeInput is missing in this google-genai version"
                    )
                )
            )
            return

        msg = f"Failed to send audio: send(input=...) failed: {_err_str(err2)}"
        logger.info("GeminiLiveSession send_audio error %s", msg)
        await self._event_q.put(LiveErrorEvent(message=msg))
        return

    async def end_audio_stream(self) -> None:
        """
        Signal end-of-audio-stream to Gemini so it can flush a response.
        (google-genai 1.63.0: send_realtime_input(audio_stream_end=True))
        """
        if self._closed or not self._live:
            return
        fn = getattr(self._live, "send_realtime_input", None)
        if callable(fn):
            try:
                maybe = fn(audio_stream_end=True)
                if inspect.isawaitable(maybe):
                    await maybe
            except Exception as e:
                # best-effort: don't fail the whole session
                logger.info("GeminiLiveSession: end_audio_stream failed: %s", str(e))

    async def events(self) -> AsyncIterator[LiveEvent]:
        while True:
            ev = await self._event_q.get()
            yield ev

    async def _iter_live_messages(self):
        """
        google-genai の live セッションからメッセージを取り出すための互換レイヤ。

        SDKバージョンによりセッションは:
        - そのまま async iterable
        - .receive() が async iterable を返す
        - .recv() を await する
        のいずれかになり得る。
        """
        live = self._live
        if live is None:
            return

        # Prefer receive(): SDKのドキュメント上の正規ルートで、ping/pong処理も進む。
        # 重要: google-genai 1.63.0 の receive() は「1モデルターン分をyieldしたら終了」するため、
        # 次ターンも受けるには receive() を繰り返し呼ぶ必要がある。
        recv_iter = getattr(live, "receive", None)
        if callable(recv_iter):
            while True:
                stream = recv_iter()
                # SDK差分で receive() が awaitable を返す可能性もある
                if inspect.isawaitable(stream):
                    stream = await stream
                if not hasattr(stream, "__aiter__"):
                    break
                async for msg in stream:  # type: ignore[operator]
                    yield msg
                # 次ターンへ
                await asyncio.sleep(0)
            return

        # 2) async iterable (fallback)
        if hasattr(live, "__aiter__"):
            async for msg in live:  # type: ignore[operator]
                yield msg
            return

        # 3) recv() -> awaitable
        recv_one = getattr(live, "recv", None)
        if callable(recv_one):
            while True:
                yield await recv_one()
            # pragma: no cover

    async def _recv_loop(self) -> None:
        """
        SDKからのイベントを受け取り、アプリ内のLiveEventへ変換する。
        """
        assert self._live is not None
        logger.info("GeminiLiveSession recv_loop started (live_type=%s)", type(self._live).__name__)
        try:
            async for msg in self._iter_live_messages():
                # msg構造はSDK依存。代表的に audio, text, transcript を拾う。
                # 可能な限り「落ちない」実装にしてログ/イベントで追えるようにする。
                try:
                    # 0) google-genai>=1.x: LiveServerMessage.server_content.model_turn.parts[].inline_data に音声が入る
                    sc = getattr(msg, "server_content", None)
                    if sc is not None:
                        # 0-a) output audio transcription (server-generated)
                        oat = (
                            getattr(sc, "output_audio_transcription", None)
                            or getattr(sc, "outputAudioTranscription", None)
                        )
                        if oat is None and isinstance(sc, dict):
                            oat = sc.get("output_audio_transcription") or sc.get("outputAudioTranscription")
                        txt = _extract_text_from_transcription_obj(oat)
                        if txt:
                            await self._event_q.put(LiveAssistantTextEvent(text=txt))

                        model_turn = getattr(sc, "model_turn", None) or getattr(sc, "modelTurn", None)
                        parts = getattr(model_turn, "parts", None) if model_turn is not None else None
                        if parts:
                            for p in parts:
                                inline = getattr(p, "inline_data", None) or getattr(p, "inlineData", None)
                                candidate = inline or p
                                mt = _extract_mime(candidate) or _extract_mime(inline)
                                b = _extract_blob_bytes(candidate)
                                if b and (mt or "").startswith("audio/"):
                                    await self._event_q.put(
                                        LiveAudioChunk(
                                            direction="out",
                                            data=b,
                                            sample_rate_hz=self._cfg.output_sample_rate_hz,
                                        )
                                    )
                                # text part fallback
                                t = getattr(p, "text", None)
                                if isinstance(t, str) and t.strip():
                                    await self._event_q.put(LiveAssistantTextEvent(text=t.strip()))

                    # 0-b) google-genai>=1.x: tool call / function call (UI操作)
                    tc = getattr(msg, "tool_call", None) or getattr(msg, "toolCall", None)
                    function_calls = _tool_call_function_calls(tc)
                    if function_calls:
                        # Best-effort: respond "ok" so the model can continue the turn.
                        try:
                            from google.genai import types  # type: ignore

                            FunctionResponse = getattr(types, "FunctionResponse", None)
                        except Exception:
                            FunctionResponse = None

                        send_tool = getattr(self._live, "send_tool_response", None)

                        for fc in function_calls:
                            name = getattr(fc, "name", None) if not isinstance(fc, dict) else fc.get("name")
                            args = getattr(fc, "args", None) if not isinstance(fc, dict) else fc.get("args")
                            call_id = getattr(fc, "id", None) if not isinstance(fc, dict) else fc.get("id")
                            if not isinstance(args, dict):
                                args = {}

                            if isinstance(name, str) and name:
                                cmd = _tool_call_to_frontend_command(name, args)
                                await self._event_q.put(
                                    LiveCommandEvent(command=cmd, tool_name=name, tool_call_id=call_id)
                                )

                                # Send tool response back to Gemini Live
                                try:
                                    if callable(send_tool) and FunctionResponse is not None:
                                        fr = FunctionResponse(
                                            name=name,
                                            response={"result": "ok"},
                                            id=call_id,
                                        )
                                        maybe = send_tool(function_responses=fr)
                                        if inspect.isawaitable(maybe):
                                            await maybe
                                except Exception as e:
                                    logger.info("GeminiLiveSession send_tool_response failed: %s", str(e))

                    # 音声出力
                    audio = getattr(msg, "audio", None) or msg.get("audio") if isinstance(msg, dict) else None
                    if audio:
                        data = audio.get("data") if isinstance(audio, dict) else None
                        if isinstance(data, (bytes, bytearray)):
                            await self._event_q.put(
                                LiveAudioChunk(
                                    direction="out",
                                    data=bytes(data),
                                    sample_rate_hz=self._cfg.output_sample_rate_hz,
                                )
                            )

                    # ASR/Transcript
                    transcript = (
                        getattr(msg, "transcript", None)
                        or msg.get("transcript") if isinstance(msg, dict) else None
                    )
                    if transcript:
                        text = transcript.get("text") if isinstance(transcript, dict) else None
                        is_final = bool(transcript.get("is_final")) if isinstance(transcript, dict) else False
                        if isinstance(text, str) and text.strip():
                            await self._event_q.put(
                                LiveTranscriptEvent(
                                    text=text.strip(),
                                    is_final=is_final,
                                    language=self._cfg.language,
                                )
                            )

                    # テキスト出力（アシスタント）
                    text_out = getattr(msg, "text", None) or msg.get("text") if isinstance(msg, dict) else None
                    if isinstance(text_out, str) and text_out.strip():
                        await self._event_q.put(LiveAssistantTextEvent(text=text_out.strip()))

                except Exception as parse_err:
                    await self._event_q.put(
                        LiveErrorEvent(message=f"Failed to parse live event: {parse_err}")
                    )
        except asyncio.CancelledError:
            logger.info("GeminiLiveSession recv_loop cancelled")
            return
        except Exception as e:
            # ここで落ちると ping/pong が進まず keepalive timeout が起きやすいのでログを必ず残す
            logger.info("GeminiLiveSession recv_loop error: %s", str(e))
            self._live_ended = True
            await self._event_q.put(LiveErrorEvent(message=f"Live session error: {e}"))
        finally:
            logger.info("GeminiLiveSession recv_loop ended")


def default_live_config(language: str = "ja") -> GeminiLiveConfig:
    # settingsのモデル名を流用しつつ、Live向けのモデルを後から差し替え可能にする
    model = getattr(settings, "GEMINI_LIVE_MODEL_NAME", "") or settings.GEMINI_MODEL_NAME
    return GeminiLiveConfig(model=model, language=language)

