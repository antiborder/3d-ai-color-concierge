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

