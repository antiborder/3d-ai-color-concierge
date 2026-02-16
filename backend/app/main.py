import os
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
# In Lambda, environment variables are set directly
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
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

