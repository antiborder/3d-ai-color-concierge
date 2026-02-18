import os
import re
from urllib.parse import urlparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.routes import voice
from app.api.routes import live_ws
from app.api.routes import ws_token
from app.config.settings import settings
from app.services.duckdns_updater import run_duckdns_updater
import asyncio

# Load .env file for local development
# In container deployments (ECS/Fargate), environment variables are set on the task definition
if os.getenv("ENVIRONMENT") != "production":
    load_dotenv()

app = FastAPI(
    title="3D Color Concierge API",
    description="API for 3D Color Picker with Voice Control and AI Chatbot",
    version="0.1.0",
)

# Background tasks
_duckdns_stop_evt = asyncio.Event()
_duckdns_task: asyncio.Task | None = None

# CORS設定
def _cors_regex_from_allowed_origins(allowed: list[str]) -> str | None:
    """
    Starlette の CORSMiddleware は allow_origins の "*.example.com" を解釈しないため、
    "https://*.cloudfront.net" のような設定は allow_origin_regex に変換して扱う。
    """
    patterns: list[str] = []
    for a in allowed:
        a = (a or "").strip()
        if not a or "*." not in a:
            continue
        try:
            p = urlparse(a)
        except Exception:
            continue

        scheme = (p.scheme or "").lower()
        host = (p.hostname or "").lower()
        if not scheme or not host.startswith("*."):
            continue
        suffix = host[2:]  # drop "*."
        # allow optional port just in case
        patterns.append(rf"{re.escape(scheme)}://.*\.{re.escape(suffix)}(?::\d+)?$")

    if not patterns:
        return None
    # re.match() is used internally, so anchor at beginning.
    return r"^(" + "|".join(patterns) + r")"


_cors_allowed = settings.get_cors_origins()
_cors_allow_regex = _cors_regex_from_allowed_origins(_cors_allowed)
# Keep exact-match origins in allow_origins; wildcard entries are handled by regex.
_cors_allow_origins = [o for o in _cors_allowed if "*." not in (o or "")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins,
    allow_origin_regex=_cors_allow_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(ws_token.router, prefix="/api/ws", tags=["ws-token"])
app.include_router(live_ws.router, prefix="/ws", tags=["live-ws"])

@app.on_event("startup")
async def _startup_tasks():
    global _duckdns_task
    _duckdns_stop_evt.clear()
    _duckdns_task = asyncio.create_task(run_duckdns_updater(_duckdns_stop_evt))


@app.on_event("shutdown")
async def _shutdown_tasks():
    global _duckdns_task
    _duckdns_stop_evt.set()
    if _duckdns_task:
        _duckdns_task.cancel()
        try:
            await _duckdns_task
        except BaseException:
            pass
        _duckdns_task = None


@app.get("/")
async def root():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "message": "3D Color Concierge API is running"}


@app.get("/health")
async def health():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}

