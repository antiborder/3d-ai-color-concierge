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
import inspect
import time
import logging
from typing import AsyncIterator, Optional

from app.services.gemini_live_types import (
    LiveAssistantTextEvent,
    LiveAudioChunk,
    LiveCommandEvent,
    LiveErrorEvent,
    LiveEvent,
    LiveTranscriptEvent,
)
from app.services.gemini_live.config import (
    DEFAULT_INPUT_SAMPLE_RATE_HZ,
    DEFAULT_OUTPUT_SAMPLE_RATE_HZ,
    GeminiLiveConfig,
)
from app.services.gemini_live.connection import (
    build_live_connect_config,
    close_live_session,
    connect_live_session,
)
from app.services.gemini_live.helpers import (
    err_str,
    make_genai_client,
)
from app.services.gemini_live.debug import log_sdk_debug_info
from app.services.gemini_live.audio_sender import (
    build_audio_payloads,
    send_audio_via_realtime_input,
    send_audio_via_typed_input,
)
from app.services.gemini_live.message_receiver import (
    iter_live_messages,
    process_live_message,
)

# NOTE: uvicorn のデフォルトlog_configでは root logger がINFOを出さないことがあるため、
# CloudWatchで確実に見える uvicorn.error ロガーへ寄せる。
logger = logging.getLogger("uvicorn.error")


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

        # Client-side UI state snapshot (kept by the WS layer). This is intentionally
        # separate from Gemini state and can be used by future tools like GET_CURRENT_COLOR.
        self.current_color_state: Optional[dict] = None
        self.current_color_updated_at: float = 0.0

        # 実装の都合上、SDK依存の受信は内部タスクでqueueに流す
        self._event_q: "asyncio.Queue[LiveEvent]" = asyncio.Queue()
        self._recv_task: Optional[asyncio.Task[None]] = None

        # google-genai の live 接続オブジェクト（型はSDKに依存するためAny相当）
        self._live = None
        self._live_cm = None  # async context manager (SDKによってはconnectがこちらを返す)
        self._did_log_sdk_debug = False
        self._out_transcription_buf: str = ""
        self._out_transcription_segment_id: Optional[str] = None
        self._out_transcription_seq: int = 0
        self._in_transcription_buf: str = ""
        self._in_transcription_segment_id: Optional[str] = None
        self._in_transcription_seq: int = 0
        self._text_part_buf: str = ""
        self._text_part_segment_id: Optional[str] = None
        self._text_part_seq: int = 0

    def set_current_color_state(self, color: dict) -> None:
        """
        Update the latest color state snapshot provided by the frontend.
        (A) phase: store only. (B) phase can expose this via a tool call.
        """
        self.current_color_state = color
        self.current_color_updated_at = time.time()

    async def __aenter__(self) -> "GeminiLiveSession":
        client = make_genai_client()
        await self._open_live(client)

        # 1回だけSDKの実体をログ出し（ECS上のバージョン差異を確定させる）
        # NOTE: 量が多く、通常運用ではノイズになるためフラグで抑制する
        if not self._did_log_sdk_debug:
            self._did_log_sdk_debug = True
            await log_sdk_debug_info(self._live)

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
        await close_live_session(self._live, self._live_cm)
        self._live = None
        self._live_cm = None

    async def _open_live(self, client) -> None:
        """
        Establish a Live session. Factored out so send_audio() can reconnect if the
        Gemini WS dies (e.g. keepalive ping timeout) before the first audio arrives.
        """
        self._live_ended = False
        config_for_connect = build_live_connect_config(self._cfg)
        self._live, self._live_cm = await connect_live_session(
            client, self._cfg.model, config_for_connect
        )

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
            client = make_genai_client()
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


    async def send_audio(self, pcm_s16le_bytes: bytes) -> None:
        if not await self._ensure_live_connected():
            return
        # SDK依存: 入力音声の送信方法はバージョン差が大きいので、複数の形を順に試す。
        # 代表例:
        # - session.send_realtime_input(audio=Blob(...)) もしくは media=Blob(...)
        # - session.send({...}) / session.send(input_audio=...)
        # NOTE: google-genai 1.63.0 の例は mime_type="audio/pcm" が基本。
        # サンプルレート等は connect config 側で指定する（realtime_input_config 等）。
        _, blob_payload, dict_bytes, dict_b64 = build_audio_payloads(pcm_s16le_bytes)

        # 1) send_realtime_input(audio=...) が使えるならそれを優先する。
        #    SDKソース上は `audio` も `media` も1つだけ指定可能（len(kwargs)==1）。
        rt_result = await send_audio_via_realtime_input(
            self._live, blob_payload, dict_bytes, allow_reconnect=True
        )
        if rt_result is None:
            return

        # Reconnect logic if needed
        if rt_result != "unavailable":
            try:
                e, e2 = rt_result  # type: ignore[misc]
            except Exception:
                e, e2 = rt_result, rt_result
            combined = f"{err_str(e)}; {err_str(e2)}"
            if "keepalive ping timeout" in combined or "no close frame received" in combined:
                # If the underlying WS is dead (keepalive ping timeout), do one reconnect + retry.
                try:
                    client = make_genai_client()
                    await self._close_live()
                    await self._open_live(client)
                    if self._recv_task is None or self._recv_task.done():
                        self._recv_task = asyncio.create_task(self._recv_loop())
                    rt_result = await send_audio_via_realtime_input(
                        self._live, blob_payload, dict_bytes, allow_reconnect=False
                    )
                    if rt_result is None:
                        return
                except Exception:
                    pass

        # audio/media の2経路が失敗した場合は理由を返して終了する。（従来挙動）
        # NOTE: send_realtime_input が無いケース（unavailable）のみ、続けて send(input=...) を試す。
        if rt_result != "unavailable":
            try:
                e, e2 = rt_result  # type: ignore[misc]
            except Exception:
                e, e2 = rt_result, rt_result
            msg = (
                f"Failed to send audio: audio=... -> {err_str(e)}; "
                f"media=... -> {err_str(e2)}"
            )
            await self._event_q.put(LiveErrorEvent(message=msg))
            return

        # 2) send_realtime_input が無いSDK向け: send(input=...) を試す（typedのみ）
        err2 = await send_audio_via_typed_input(self._live, dict_bytes, dict_b64, pcm_s16le_bytes)
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

        msg = f"Failed to send audio: send(input=...) failed: {err_str(err2)}"
        logger.info("GeminiLiveSession send_audio error %s", msg)
        await self._event_q.put(LiveErrorEvent(message=msg))
        return

    async def send_text(self, text: str) -> None:
        """
        Send a text message to Gemini Live API, which will be converted to audio response.
        """
        if not await self._ensure_live_connected():
            return
        
        fn = getattr(self._live, "send_realtime_input", None)
        if not callable(fn):
            await self._event_q.put(
                LiveErrorEvent(message="send_realtime_input is not available for text input")
            )
            return
        
        try:
            # Send text via send_realtime_input
            # Try text= parameter first, then fallback to other possible parameter names
            maybe = fn(text=text)
            if inspect.isawaitable(maybe):
                await maybe
        except Exception as e:
            # Try alternative parameter names if text= fails
            try:
                maybe = fn(input=text)
                if inspect.isawaitable(maybe):
                    await maybe
            except Exception as e2:
                logger.info("GeminiLiveSession send_text error: %s (fallback also failed: %s)", str(e), str(e2))
                await self._event_q.put(
                    LiveErrorEvent(message=f"Failed to send text: {e}")
                )

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

    async def _recv_loop(self) -> None:
        """
        SDKからのイベントを受け取り、アプリ内のLiveEventへ変換する。
        """
        assert self._live is not None
        logger.info("GeminiLiveSession recv_loop started (live_type=%s)", type(self._live).__name__)
        try:
            async for msg in iter_live_messages(self._live):
                # msg構造はSDK依存。代表的に audio, text, transcript を拾う。
                # 可能な限り「落ちない」実装にしてログ/イベントで追えるようにする。
                try:
                    (
                        self._out_transcription_buf,
                        self._out_transcription_segment_id,
                        self._out_transcription_seq,
                        self._in_transcription_buf,
                        self._in_transcription_segment_id,
                        self._in_transcription_seq,
                        self._text_part_buf,
                        self._text_part_segment_id,
                        self._text_part_seq,
                    ) = await process_live_message(
                        msg,
                        self._event_q,
                        self._cfg,
                        self._live,
                        self.current_color_state,
                        self.current_color_updated_at,
                        self._out_transcription_buf,
                        self._out_transcription_segment_id,
                        self._out_transcription_seq,
                        self._in_transcription_buf,
                        self._in_transcription_segment_id,
                        self._in_transcription_seq,
                        self._text_part_buf,
                        self._text_part_segment_id,
                        self._text_part_seq,
                    )
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



