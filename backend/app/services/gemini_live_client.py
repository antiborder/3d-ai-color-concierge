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
    LiveErrorEvent,
    LiveEvent,
    LiveTranscriptEvent,
)

# NOTE: uvicorn のデフォルトlog_configでは root logger がINFOを出さないことがあるため、
# CloudWatchで確実に見える uvicorn.error ロガーへ寄せる。
logger = logging.getLogger("uvicorn.error")

DEFAULT_INPUT_SAMPLE_RATE_HZ = 16000
DEFAULT_OUTPUT_SAMPLE_RATE_HZ = 24000


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
        if not self._did_log_sdk_debug:
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

    async def send_audio(self, pcm_s16le_bytes: bytes) -> None:
        if self._closed:
            return
        if self._live_ended or not self._live:
            # If Gemini closed the session due to inactivity, reconnect on first audio.
            try:
                from google import genai  # type: ignore

                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                await self._close_live()
                await self._open_live(client)
                if self._recv_task is None or self._recv_task.done():
                    self._recv_task = asyncio.create_task(self._recv_loop())
            except Exception as e:
                await self._event_q.put(LiveErrorEvent(message=f"Failed to reconnect Gemini Live session: {e}"))
                return
        # SDK依存: 入力音声の送信方法はバージョン差が大きいので、複数の形を順に試す。
        # 代表例:
        # - session.send_realtime_input(audio=Blob(...)) もしくは media=Blob(...)
        # - session.send({...}) / session.send(input_audio=...)
        # NOTE: google-genai 1.63.0 の例は mime_type="audio/pcm" が基本。
        # サンプルレート等は connect config 側で指定する（realtime_input_config 等）。
        mime = "audio/pcm"
        # SDKが types.Blob を要求する場合と dict を受け付ける場合があるので両対応する
        blob_payload = None
        try:
            from google.genai import types  # type: ignore

            Blob = getattr(types, "Blob", None)
            if Blob is not None:
                blob_payload = Blob(data=pcm_s16le_bytes, mime_type=mime)
        except Exception:
            blob_payload = None

        # dict fallback variants
        dict_bytes = {"mime_type": mime, "data": pcm_s16le_bytes}
        dict_b64 = {"mime_type": mime, "data": base64.b64encode(pcm_s16le_bytes).decode("ascii")}

        async def _await_if_needed(x):
            if inspect.isawaitable(x):
                return await x
            return x

        def _err_str(e: Exception, limit: int = 240) -> str:
            s = str(e)
            if len(s) > limit:
                return s[:limit] + "…"
            return s

        last_err: Optional[Exception] = None

        # 1) send_realtime_input(audio=...) が使えるならそれを優先する。
        #    SDKソース上は `audio` も `media` も1つだけ指定可能（len(kwargs)==1）。
        fn = getattr(self._live, "send_realtime_input", None)
        if callable(fn):
            try:
                await _await_if_needed(fn(audio=blob_payload or dict_bytes))
                return
            except Exception as e:
                last_err = e
                # SDKドキュメント/実装例では audio ではなく media に音声Blobを入れる例もあるためフォールバック
                try:
                    await _await_if_needed(fn(media=blob_payload or dict_bytes))
                    return
                except Exception as e2:
                    # If the underlying WS is dead (keepalive ping timeout), do one reconnect + retry.
                    combined = f"{_err_str(e)}; {_err_str(e2)}"
                    if "keepalive ping timeout" in combined or "no close frame received" in combined:
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
                                return
                        except Exception:
                            pass
                    # ここでは send(input=...) にフォールバックしても音声扱いされず迷走しがちなので、
                    # 2経路の失敗理由を返して終了する。
                    msg = (
                        f"Failed to send audio: audio=... -> {_err_str(e)}; "
                        f"media=... -> {_err_str(e2)}"
                    )
                    await self._event_q.put(LiveErrorEvent(message=msg))
                    return

        # 2) send_realtime_input が無いSDK向け: send(input=...) を試す（typedのみ）
        send_attr = getattr(self._live, "send", None)
        send_fn = send_attr
        if callable(send_fn):
            # 2-a) Typed realtime input (推奨)
            try:
                from google.genai import types  # type: ignore

                rt = getattr(types, "LiveClientRealtimeInput", None)
                if rt is not None:
                    # このSDKバージョンでは `audio` ではなく `media` が正しい可能性がある。
                    # モデルのフィールドを見て最適なキーで初期化する。
                    fields = getattr(rt, "model_fields", None)
                    field_keys = set(fields.keys()) if isinstance(fields, dict) else set()
                    rt_obj = None
                    rt_err: Optional[Exception] = None

                    # google-genai==0.8.0 のログでは LiveClientRealtimeInput_fields=["media_chunks"] が確定。
                    # その場合は media_chunks=[chunk] の形で送る（chunk は型or dict）。
                    if "media_chunks" in field_keys:
                        # まずは "chunk" の型が用意されていればそれを優先
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

                        # chunk の候補（bytes は弾かれる可能性が高いので b64 を先に試す）
                        chunk_dict_candidates = [
                            ("dict_b64", dict_b64),
                            ("dict_bytes", dict_bytes),
                        ]
                        if blob_payload is not None:
                            # 一部バージョンでは Blob が chunk として通る場合がある
                            chunk_dict_candidates.insert(0, ("Blob", blob_payload))

                        for cname, cval in chunk_dict_candidates:
                            try:
                                if chunk_type is not None and callable(chunk_type):
                                    # pydantic model なら **kwargs を期待することが多い
                                    if isinstance(cval, dict):
                                        chunk_obj = chunk_type(**cval)
                                    else:
                                        # Blob 等
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
                            ("Blob", blob_payload),
                            ("dict_bytes", dict_bytes),
                            ("dict_b64", dict_b64),
                            ("raw_bytes", pcm_s16le_bytes),
                        ]
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
                        msg = (
                            "Failed to send audio: cannot construct LiveClientRealtimeInput: "
                            f"{_err_str(rt_err)}"
                        )
                        await self._event_q.put(LiveErrorEvent(message=msg))
                        return

                    # send() のシグネチャに合わせて渡す kwargs を絞る
                    try:
                        sig = inspect.signature(send_fn)
                        params = set(sig.parameters.keys())
                    except Exception:
                        params = {"input", "end_of_turn"}

                    for kwargs in (
                        {"input": rt_obj},
                        {"input": rt_obj, "end_of_turn": False},
                    ):
                        filtered = {k: v for k, v in kwargs.items() if k in params}
                        try:
                            await _await_if_needed(send_fn(**filtered))
                            return
                        except TypeError as e:
                            last_err = e
                        except Exception as e:
                            last_err = e
                            break
                    # send() を試したが全て失敗した場合は、ここで理由を返して終了（fallthroughしない）
                    msg = (
                        f"Failed to send audio: send(input=...) failed: {_err_str(last_err)}"
                        if last_err
                        else "Failed to send audio: send(input=...) failed"
                    )
                    logger.info("GeminiLiveSession send_audio error %s", msg)
                    await self._event_q.put(LiveErrorEvent(message=msg))
                    return
                else:
                    # typedが無いなら、SDK差分なので無理にdictを投げずに切り分け情報を返す
                    msg = (
                        "Failed to send audio: send_realtime_input is unavailable and "
                        "types.LiveClientRealtimeInput is missing in this google-genai version"
                    )
                    await self._event_q.put(LiveErrorEvent(message=msg))
                    return
            except Exception as e:
                last_err = e
                msg = f"Failed to send audio: send(input=...) failed: {_err_str(e)}"
                logger.info("GeminiLiveSession send_audio error %s", msg)
                await self._event_q.put(LiveErrorEvent(message=msg))
                return

        # ここまで来る場合は、SDKに send_realtime_input も send も無い/見つからない。
        sendish = []
        try:
            sendish = sorted(
                [
                    n
                    for n in dir(self._live)
                    if ("send" in n or "realtime" in n) and not n.startswith("_")
                ]
            )[:40]
        except Exception:
            pass
        msg = (
            "Failed to send audio: no supported send method on live session "
            f"(send_attr_type={type(send_attr).__name__}, send_callable={callable(send_attr)}, "
            f"sendish={sendish})"
        )
        try:
            msg += f" (live_type={type(self._live).__name__})"
        except Exception:
            pass
        logger.info("GeminiLiveSession send_audio error %s", msg)
        await self._event_q.put(LiveErrorEvent(message=msg))

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

                    # 0) google-genai>=1.x: LiveServerMessage.server_content.model_turn.parts[].inline_data に音声が入る
                    sc = getattr(msg, "server_content", None)
                    if sc is not None:
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

