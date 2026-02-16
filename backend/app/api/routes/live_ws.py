"""
Gemini Live 音声ストリーミング用 WebSocket エンドポイント。

プロトコル（アプリ内の最小仕様）:
- クライアント → サーバ
  - Text(JSON):
    - {"type":"start","language":"ja"|"en"}  (最初に必ず送る)
    - {"type":"stop"}                       (任意)
  - Binary:
    - PCM S16LE 16kHz mono の生フレーム（複数回送信）

- サーバ → クライアント
  - Text(JSON):
    - {"type":"ready","inputSampleRateHz":16000,"outputSampleRateHz":24000}
    - {"type":"transcript","text":"...","final":true|false}
    - {"type":"assistant_text","text":"..."} (SDKがテキストも返す場合)
    - {"type":"error","message":"..."}
  - Binary:
    - PCM S16LE 24kHz mono の生フレーム（Gemini音声出力）
"""

from __future__ import annotations

import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.gemini_live_client import (
    DEFAULT_INPUT_SAMPLE_RATE_HZ,
    DEFAULT_OUTPUT_SAMPLE_RATE_HZ,
    GeminiLiveSession,
    default_live_config,
)
from app.services.gemini_live_types import (
    LiveAssistantTextEvent,
    LiveAudioChunk,
    LiveErrorEvent,
    LiveTranscriptEvent,
)
from app.utils.ws_auth import extract_cookie, verify_ws_token
from app.utils.origin_check import is_origin_allowed
from app.utils.rate_limit import FixedWindowRateLimiter
from app.config.settings import settings


router = APIRouter()

_conn_limiter = FixedWindowRateLimiter(limit=20, window_seconds=60)
logger = logging.getLogger(__name__)


@router.websocket("/live")
async def live_voice_ws(ws: WebSocket):
    # NOTE:
    # CloudFront等のプロキシ配下では、WSを accept() する前に close() すると
    # ブラウザ側は close code を受け取れず 1006 になりがち。
    # ここでは「失敗理由をできるだけクライアントへ返す」ことを優先してログ/例外処理を厚めにする。
    # Origin check (browser only). If no origin (non-browser), allow.
    origin = ws.headers.get("origin", "")
    if origin and not is_origin_allowed(origin, settings.get_cors_origins()):
        logger.info("WS reject: origin not allowed", {"origin": origin})
        try:
            await ws.accept()
            await ws.send_text(json.dumps({"type": "error", "message": "Origin not allowed"}))
        except Exception:
            pass
        await ws.close(code=1008)
        return

    # crude rate limit by client ip (x-forwarded-for first)
    xff = ws.headers.get("x-forwarded-for", "")
    client_ip = (xff.split(",")[0].strip() if xff else None) or (ws.client.host if ws.client else "unknown")
    if not _conn_limiter.allow(client_ip):
        logger.info("WS reject: rate limited", {"client_ip": client_ip})
        try:
            await ws.accept()
            await ws.send_text(json.dumps({"type": "error", "message": "Rate limited"}))
        except Exception:
            pass
        await ws.close(code=1013)  # Try again later
        return

    # Auth token via HttpOnly cookie or query param (dev fallback for 3P-cookie blocked browsers)
    cookie = ws.headers.get("cookie")
    token = extract_cookie(cookie, "ws_token") or ws.query_params.get("ws_token") or ws.query_params.get("token")
    if not token or not verify_ws_token(token):
        logger.info(
            "WS reject: missing/invalid ws_token cookie",
            {
                "client_ip": client_ip,
                "origin": origin,
                "has_cookie_header": bool(cookie),
                "has_ws_token": bool(token),
            },
        )
        try:
            await ws.accept()
            await ws.send_text(json.dumps({"type": "error", "message": "Auth token missing or invalid"}))
        except Exception:
            pass
        await ws.close(code=1008)
        return

    await ws.accept()

    # startメッセージ待ち（無ければ切断）
    try:
        first = await ws.receive_text()
        msg = json.loads(first)
        if msg.get("type") != "start":
            await ws.send_text(json.dumps({"type": "error", "message": "First message must be {type:'start'}"}))
            await ws.close(code=1002)
            return
        language = msg.get("language", "ja")
        if language not in ("ja", "en"):
            language = "ja"
    except WebSocketDisconnect:
        # クライアント都合で切れた場合は何もしない
        return
    except Exception:
        try:
            await ws.send_text(json.dumps({"type": "error", "message": "Invalid start message"}))
            await ws.close(code=1002)
        except Exception:
            pass
        return

    await ws.send_text(
        json.dumps(
            {
                "type": "ready",
                "inputSampleRateHz": DEFAULT_INPUT_SAMPLE_RATE_HZ,
                "outputSampleRateHz": DEFAULT_OUTPUT_SAMPLE_RATE_HZ,
            }
        )
    )

    cfg = default_live_config(language=language)
    stop_evt = asyncio.Event()

    async def client_to_live(session: GeminiLiveSession):
        try:
            while not stop_evt.is_set():
                incoming = await ws.receive()
                if "text" in incoming and incoming["text"] is not None:
                    try:
                        payload = json.loads(incoming["text"])
                        if payload.get("type") == "stop":
                            stop_evt.set()
                            # Let Gemini flush a response for the current utterance.
                            try:
                                await session.end_audio_stream()
                            except Exception:
                                pass
                            return
                    except Exception:
                        # 不正テキストは無視（プロトコル簡略化）
                        continue
                elif "bytes" in incoming and incoming["bytes"] is not None:
                    await session.send_audio(incoming["bytes"])
        except WebSocketDisconnect:
            try:
                await session.end_audio_stream()
            except Exception:
                pass
            stop_evt.set()
        except RuntimeError:
            # Starlette can raise RuntimeError after a disconnect message has been received.
            # Treat it as disconnect and stop quietly.
            try:
                await session.end_audio_stream()
            except Exception:
                pass
            stop_evt.set()
        except Exception as e:
            # 接続が既に閉じられている可能性があるため、送信はbest-effort
            try:
                await ws.send_text(json.dumps({"type": "error", "message": f"client receive error: {e}"}))
            except Exception:
                pass
            try:
                await session.end_audio_stream()
            except Exception:
                pass
            stop_evt.set()

    async def live_to_client(session: GeminiLiveSession):
        async for ev in session.events():
            if stop_evt.is_set():
                return
            if isinstance(ev, LiveAudioChunk) and ev.direction == "out":
                # 音声はbinaryで返す
                await ws.send_bytes(ev.data)
            elif isinstance(ev, LiveTranscriptEvent):
                await ws.send_text(
                    json.dumps(
                        {
                            "type": "transcript",
                            "text": ev.text,
                            "final": ev.is_final,
                            "language": ev.language,
                        }
                    )
                )
            elif isinstance(ev, LiveAssistantTextEvent):
                await ws.send_text(json.dumps({"type": "assistant_text", "text": ev.text}))
            elif isinstance(ev, LiveErrorEvent):
                await ws.send_text(json.dumps({"type": "error", "message": ev.message, "code": ev.code}))

    try:
        async with GeminiLiveSession(cfg) as session:
            t1 = asyncio.create_task(client_to_live(session))
            t2 = asyncio.create_task(live_to_client(session))

            done, pending = await asyncio.wait({t1, t2}, return_when=asyncio.FIRST_COMPLETED)
            for p in pending:
                p.cancel()
    except Exception as e:
        logger.exception("WS internal error", extra={"origin": origin, "client_ip": client_ip})
        # best-effort: send error to client before closing
        try:
            await ws.send_text(json.dumps({"type": "error", "message": f"Internal error: {e}"}))
        except Exception:
            pass
        try:
            await ws.close(code=1011)
        except Exception:
            pass
        return

    try:
        await ws.close()
    except Exception:
        pass

