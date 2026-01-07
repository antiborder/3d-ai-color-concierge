from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import voice
from app.config.settings import settings

app = FastAPI(
    title="3D Color Concierge API",
    description="API for 3D Color Picker with Voice Control and AI Chatbot",
    version="0.1.0",
)

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


@app.get("/")
async def root():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "message": "3D Color Concierge API is running"}


@app.get("/health")
async def health():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}

