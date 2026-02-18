"""
アプリケーション設定
"""
from pydantic_settings import BaseSettings
from typing import List, Union
import os


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # CORS設定（環境変数から読み込む場合はカンマ区切り文字列）
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
        "https://*.cloudfront.net",  # CloudFront経由のアクセス
    ]
    
    # API設定
    API_VERSION: str = "v1"
    
    # 環境
    ENVIRONMENT: str = "development"
    
    # Gemini API設定
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-3-flash-preview"  # Gemini 3 Flash (preview) as per design document

    # Gemini Live API設定（音声ストリーミング）
    # SDK/モデル名は変わりやすいので、別ENVで上書き可能にしておく
    GEMINI_LIVE_MODEL_NAME: str = "gemini-2.5-flash-native-audio-preview-12-2025"  # 実運用では適切なLive対応モデル名に差し替え

    # Gemini Live の API version
    # - output_audio_transcription 等の一部機能が v1alpha 限定の場合があるため、必要なら v1alpha を使う
    # 例: GEMINI_LIVE_API_VERSION=v1alpha
    GEMINI_LIVE_API_VERSION: str = "v1alpha"

    # Gemini Live SDK の詳細 introspection ログを出すか（通常は不要でログが肥大化する）
    # 例: GEMINI_LIVE_SDK_DEBUG=1
    GEMINI_LIVE_SDK_DEBUG: bool = False

    # Gemini Live 受信イベント（output_audio_transcription 等）のデバッグログを出すか
    # 例: GEMINI_LIVE_CHAT_DEBUG=1
    GEMINI_LIVE_CHAT_DEBUG: bool = False

    # WebSocket 認証（短命トークン署名）
    # - 本番では必ず安全な値を注入する
    # - ローカル開発では scripts/dev/run-backend-local.sh が自動生成する
    WS_TOKEN_SECRET: str = ""
    WS_TOKEN_TTL_SEC: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def get_cors_origins(self) -> List[str]:
        """CORS originsをリストとして取得"""
        if isinstance(self.CORS_ORIGINS, str):
            # 環境変数から読み込んだ場合（カンマ区切り）
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    def validate_gemini_key(self) -> None:
        """Gemini APIキーの検証"""
        if not self.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is not set")


settings = Settings()

