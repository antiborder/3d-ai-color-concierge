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
    LiveCommandEvent,
    LiveErrorEvent,
    LiveTranscriptEvent,
)
from app.utils.ws_auth import extract_cookie, verify_ws_token
from app.utils.origin_check import is_origin_allowed
from app.utils.rate_limit import FixedWindowRateLimiter
from app.config.settings import settings


router = APIRouter()

_conn_limiter = FixedWindowRateLimiter(limit=20, window_seconds=60)
# Use uvicorn logger so it ends up in backend-local.log consistently.
logger = logging.getLogger("uvicorn.error")

def _clamp_int(v, lo: int, hi: int):
    try:
        if isinstance(v, bool):
            return None
        iv = int(v)
    except Exception:
        return None
    if iv < lo:
        iv = lo
    if iv > hi:
        iv = hi
    return iv


def _normalize_color_state(color) -> dict | None:
    """
    Best-effort validation for frontend-sent color_state.
    We require r/g/b; other fields are optional and clamped.
    """
    if not isinstance(color, dict):
        return None
    r = _clamp_int(color.get("r"), 0, 255)
    g = _clamp_int(color.get("g"), 0, 255)
    b = _clamp_int(color.get("b"), 0, 255)
    if r is None or g is None or b is None:
        return None
    out: dict = {"r": r, "g": g, "b": b}

    opt_specs = {
        "c": (0, 100),
        "m": (0, 100),
        "y": (0, 100),
        "k": (0, 100),
        "h": (0, 360),
        "s": (0, 100),
        "l": (0, 100),
        "hsvS": (0, 100),
        "v": (0, 100),
    }
    for k, (lo, hi) in opt_specs.items():
        if k in color:
            vv = _clamp_int(color.get(k), lo, hi)
            if vv is not None:
                out[k] = vv
    return out


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
    color_state_received = asyncio.Event()

    async def client_to_live(session: GeminiLiveSession):
        try:
            while not stop_evt.is_set():
                incoming = await ws.receive()
                if "text" in incoming and incoming["text"] is not None:
                    try:
                        payload = json.loads(incoming["text"])
                        msg_type = payload.get("type") if isinstance(payload, dict) else None
                        if msg_type == "stop":
                            stop_evt.set()
                            # Let Gemini flush a response for the current utterance.
                            try:
                                await session.end_audio_stream()
                            except Exception:
                                pass
                            return
                        if msg_type == "color_state" and isinstance(payload, dict):
                            color = _normalize_color_state(payload.get("color"))
                            if color:
                                session.set_current_color_state(color)
                                # 色状態が設定されたことを通知
                                color_state_received.set()
                                if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
                                    try:
                                        logger.info(
                                            "LIVE_CHAT_DEBUG recv color_state rgb=(%s,%s,%s) keys=%s",
                                            color.get("r"),
                                            color.get("g"),
                                            color.get("b"),
                                            sorted(list(color.keys())),
                                        )
                                    except Exception:
                                        logger.info("LIVE_CHAT_DEBUG recv color_state (failed to log details)")
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
            except Exception as e2:
                logger.info("GeminiLiveSession end_audio_stream failed: %s", str(e2))
            stop_evt.set()

    async def live_to_client(session: GeminiLiveSession):
        async for ev in session.events():
            if stop_evt.is_set():
                return
            if isinstance(ev, LiveAudioChunk) and ev.direction == "out":
                # 音声はbinaryで返す
                await ws.send_bytes(ev.data)
            elif isinstance(ev, LiveTranscriptEvent):
                if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
                    try:
                        logger.info(
                            "LIVE_CHAT_DEBUG send transcript final=%s txt_len=%s txt_preview=%r",
                            ev.is_final,
                            len(ev.text) if ev.text else 0,
                            (ev.text[:200] if ev.text else None),
                        )
                    except Exception:
                        logger.info("LIVE_CHAT_DEBUG send transcript (failed to log details)")
                await ws.send_text(
                    json.dumps(
                        {
                            "type": "transcript",
                            "text": ev.text,
                            "final": ev.is_final,
                            "language": ev.language,
                            "segmentId": ev.segment_id,
                        }
                    )
                )
            elif isinstance(ev, LiveAssistantTextEvent):
                if getattr(settings, "GEMINI_LIVE_CHAT_DEBUG", False):
                    try:
                        logger.info(
                            "LIVE_CHAT_DEBUG send assistant_text source=%s segmentId=%s final=%s txt_len=%s txt_preview=%r",
                            ev.source,
                            ev.segment_id,
                            ev.is_final,
                            len(ev.text) if ev.text else 0,
                            (ev.text[:200] if ev.text else None),
                        )
                    except Exception:
                        logger.info("LIVE_CHAT_DEBUG send assistant_text (failed to log details)")
                await ws.send_text(
                    json.dumps(
                        {
                            "type": "assistant_text",
                            "text": ev.text,
                            "source": ev.source,
                            "segmentId": ev.segment_id,
                            "final": ev.is_final,
                        }
                    )
                )
            elif isinstance(ev, LiveCommandEvent):
                await ws.send_text(
                    json.dumps(
                        {
                            "type": "command",
                            "command": ev.command,
                            "tool_name": ev.tool_name,
                            "tool_call_id": ev.tool_call_id,
                        }
                    )
                )
            elif isinstance(ev, LiveErrorEvent):
                await ws.send_text(json.dumps({"type": "error", "message": ev.message, "code": ev.code}))

    async def send_introduction(session: GeminiLiveSession):
        """
        色状態が送信されるのを待ってから自己紹介を送信
        """
        # 色状態が送信されるのを待つ（最大1.5秒）
        try:
            await asyncio.wait_for(color_state_received.wait(), timeout=1.5)
        except asyncio.TimeoutError:
            # タイムアウトしても続行（色状態が送信されなかった場合）
            pass
        
        # 色状態が設定された後に自己紹介を送信
        await asyncio.sleep(0.2)  # 色状態処理の完了を待つ
        
        # 自己紹介プロンプト（短く、色に言及し、提案を含める）
        introduction_prompt = (
            "以下の順序で応答してください：\n"
            "1. 最初に短く自己紹介：「初めまして。3D AI Color Conciergeです。あなたの色彩設計を3D空間でサポートいたします。」「初めまして。カラフルな3D空間でカラーコーディネイトのお手伝いをさせていただきます。」「 様々な色彩がわかりやすく配列された色空間で、あなたの色選びをサポートいたします。」\n"
            "2. 現在選択されている色について、簡潔に自然な表現で言及してください（例：「現在選択されているのは深い海の色ですね」）。"
            "PCCSトーンや専門用語は使わず、色の名前や自然な表現のみを使用してください。\n"
            "3. 最後に、何かしらの提案をしてください（例：「このような色はお好みですか？」「この色の明るさをあなたの好みに合わせて調整しましょうか？」「もっと別の色を探してみましょうか？」「もっと鮮やかな方がお好みですか？」など）。"
            if language == "ja"
            else "Please respond in the following order:\n"
            "1. First, briefly introduce yourself: 'Nice to meet you! I'm your 3D AI Color Concierge. I'll support your color design in 3D space.'\n"
            "2. Mention the currently selected color briefly and naturally (e.g., 'The currently selected color is a deep ocean blue'). "
            "Do not use PCCS tone names or technical terms, only use color names or natural expressions.\n"
            "3. Finally, make a suggestion (e.g., 'Do you like this color?', 'Would you like to adjust the brightness of this color to your preference?', 'Would you like to explore other colors?', 'Do you prefer a more vibrant color?', etc.)."
        )
        try:
            await session.send_text(introduction_prompt)
        except Exception as e:
            # 自己紹介送信の失敗は致命的ではないのでログのみ
            logger.info("Failed to send introduction prompt: %s", str(e))

    try:
        async with GeminiLiveSession(cfg) as session:
            # 自己紹介を送信するタスクを開始
            intro_task = asyncio.create_task(send_introduction(session))
            
            t1 = asyncio.create_task(client_to_live(session))
            t2 = asyncio.create_task(live_to_client(session))

            done, pending = await asyncio.wait({t1, t2}, return_when=asyncio.FIRST_COMPLETED)
            for p in pending:
                p.cancel()
            # best-effort: wait for cancellation to settle
            await asyncio.gather(*pending, return_exceptions=True)
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

