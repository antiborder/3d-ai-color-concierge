"""
Gemini Live 音声ストリーミング用 WebSocket エンドポイント。

プロトコル（アプリ内の最小仕様）:
- クライアント → サーバ
  - Text(JSON):
    - {"type":"start","language":"ja"|"en"}  (最初に必ず送る)
    - {"type":"stop"}                       (任意)
    - {"type":"color_state","color":{...}}  (任意: 現在色の同期)
  - Binary:
    - PCM S16LE 16kHz mono の生フレーム（複数回送信）

- サーバ → クライアント
  - Text(JSON):
    - {"type":"ready","inputSampleRateHz":16000,"outputSampleRateHz":24000}
    - {"type":"transcript","text":"...","final":true|false}
    - {"type":"assistant_text","text":"..."} (SDKがテキストも返す場合)
    - {"type":"command","command":{...},"tool_name":"...","tool_call_id":"..."} (tool callでUI操作する場合)
    - {"type":"error","message":"..."}
  - Binary:
    - PCM S16LE 24kHz mono の生フレーム（Gemini音声出力）
"""

from __future__ import annotations

import asyncio
import json
import logging
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config.settings import settings
from app.services.gemini_live import (
    DEFAULT_INPUT_SAMPLE_RATE_HZ,
    DEFAULT_OUTPUT_SAMPLE_RATE_HZ,
    GeminiLiveSession,
    default_live_config,
)
from app.services.prompts.common import get_color_service_for_prompt
from app.services.ws.context import SessionContext
from app.services.ws.event_dispatcher import EventDispatcher
from app.services.ws.gemini_websocket import GeminiWebSocket
from app.services.ws.user_websocket import UserWebSocket
from app.utils.origin_check import is_origin_allowed
from app.utils.rate_limit import FixedWindowRateLimiter
from app.utils.ws_auth import extract_cookie, verify_ws_token

router = APIRouter()

_conn_limiter = FixedWindowRateLimiter(limit=20, window_seconds=60)
# Use uvicorn logger so it ends up in backend-local.log consistently.
logger = logging.getLogger("uvicorn.error")


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
    client_ip = (xff.split(",")[0].strip() if xff else None) or (
        ws.client.host if ws.client else "unknown"
    )
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
    token = (
        extract_cookie(cookie, "ws_token")
        or ws.query_params.get("ws_token")
        or ws.query_params.get("token")
    )
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
            await ws.send_text(
                json.dumps({"type": "error", "message": "Auth token missing or invalid"})
            )
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
            await ws.send_text(
                json.dumps({"type": "error", "message": "First message must be {type:'start'}"})
            )
            await ws.close(code=1002)
            return
        language = msg.get("language", "ja")
        if language not in ("ja", "en"):
            language = "ja"
        # 初回フラグを取得（デフォルトはTrueで後方互換性を保つ）
        is_first_time = msg.get("isFirstTime", True)
        skip_greeting = msg.get("skipGreeting", False)
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

    # パフォーマンス測定用のタイムスタンプ追跡
    session_id = id(ws)
    perf_timestamps = {
        "start": time.time(),
        "last_audio_received": None,
        "last_audio_sent_to_gemini": None,
        "last_gemini_response": None,
        "last_response_sent": None,
    }

    try:
        color_service = get_color_service_for_prompt()
        async with GeminiLiveSession(cfg, color_service=color_service) as session:
            ctx = SessionContext(
                session_id=session_id,
                stop_event=stop_evt,
                language=language,
                color_service=color_service,
                perf_timestamps=perf_timestamps,
            )
            gemini_ws = GeminiWebSocket(session=session)
            user_ws = UserWebSocket(ws=ws)
            ctx.gemini_ws = gemini_ws
            ctx.user_ws = user_ws

            dispatcher = EventDispatcher(ctx=ctx)
            dispatcher.register_all(gemini_ws.event_registry)
            dispatcher.register_all(user_ws.event_registry)

            tasks = [
                asyncio.create_task(gemini_ws.receive_loop(dispatcher.queue)),
                asyncio.create_task(user_ws.receive_loop(dispatcher.queue)),
                asyncio.create_task(dispatcher.run()),
            ]

            intro_task = None

            async def _send_intro() -> None:
                if skip_greeting:
                    return
                from app.services.prompts.introduction import (
                    build_introduction_prompt,
                    build_regreeting_prompt,
                )

                prompt = (
                    build_introduction_prompt(language)
                    if is_first_time
                    else build_regreeting_prompt(language)
                )
                try:
                    await session.send_text(prompt)
                except Exception as e:
                    logger.info("Failed to send intro/regreeting prompt: %s", str(e))

            intro_task = asyncio.create_task(_send_intro())

            done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            if intro_task and not intro_task.done():
                intro_task.cancel()
            try:
                await session.end_audio_stream()
            except Exception:
                pass
            for p in pending:
                p.cancel()
            await asyncio.gather(*pending, return_exceptions=True)
            if intro_task:
                await asyncio.gather(intro_task, return_exceptions=True)
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
