"""
音声処理APIエンドポイント
"""
import logging
from fastapi import APIRouter, HTTPException
from app.api.schemas.voice import (
    VoiceProcessRequest,
    VoiceProcessResponse,
    ConversationMessage,
    Command,
)
from app.services.gemini_service import GeminiService
from app.config.settings import settings
from app.utils.voice_normalizer import normalize_transcript

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice(request: VoiceProcessRequest):
    """
    音声認識結果を処理するエンドポイント
    
    Gemini APIを使用してコマンド解析とチャットボット応答を生成
    """
    try:
        # バリデーション: 会話履歴の最大件数チェック
        if len(request.conversation_history) > 50:
            raise HTTPException(
                status_code=400,
                detail="Conversation history exceeds maximum of 50 messages"
            )
        
        # Gemini APIキーの検証
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Gemini API key is not configured"
            )
        
        # 音声認識結果の正規化（Step 4.3）
        normalized_transcript = normalize_transcript(
            request.transcript,
            language=request.language
        )
        
        # Geminiサービスを初期化
        gemini_service = GeminiService()
        
        # 音声入力を処理（正規化されたtranscriptを使用）
        response_type, command, response_text, updated_history = gemini_service.process_voice_input(
            transcript=normalized_transcript,
            current_color=request.current_color,
            conversation_history=request.conversation_history,
            language=request.language
        )
        
        # レスポンスを構築
        response = VoiceProcessResponse(
            type=response_type,
            command=command,
            response=response_text,
            updated_history=updated_history,
        )
        
        return response
        
    except HTTPException:
        raise
    except ValueError as e:
        # 設定エラーなど
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Configuration error: {str(e)}"
        )
    except RuntimeError as e:
        # Gemini API呼び出しエラー
        error_message = str(e)
        logger.error(f"Gemini API error: {error_message}")
        
        # エラーメッセージに基づいて適切なHTTPステータスコードを設定
        if "Authentication failed" in error_message:
            status_code = 401
        elif "Rate limit exceeded" in error_message:
            status_code = 429
        elif "Invalid request" in error_message:
            status_code = 400
        elif "timeout" in error_message.lower():
            status_code = 504
        else:
            status_code = 500
        
        raise HTTPException(
            status_code=status_code,
            detail=error_message
        )
    except Exception as e:
        # 予期しないエラー
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

