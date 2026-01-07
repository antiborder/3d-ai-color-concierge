"""
音声処理APIエンドポイント
"""
from fastapi import APIRouter, HTTPException
from app.api.schemas.voice import (
    VoiceProcessRequest,
    VoiceProcessResponse,
    ConversationMessage,
    Command,
)

router = APIRouter()


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice(request: VoiceProcessRequest):
    """
    音声認識結果を処理するエンドポイント
    
    フェーズ4.1ではモック実装として、基本的なレスポンスを返す
    フェーズ4.2でGemini API統合を実装
    """
    try:
        # バリデーション: 会話履歴の最大件数チェック
        if len(request.conversation_history) > 50:
            raise HTTPException(
                status_code=400,
                detail="Conversation history exceeds maximum of 50 messages"
            )
        
        # フェーズ4.1: モック実装
        # フェーズ4.2でGemini API統合を実装
        
        # 簡単なモックレスポンス
        # 実際の実装では、Gemini APIを呼び出してコマンド解析を行う
        mock_response = VoiceProcessResponse(
            type="command",
            command=Command(
                action="select_color",
                parameters={"color": {"r": 255, "g": 0, "b": 0}}
            ),
            response=None,
            updated_history=[
                ConversationMessage(role="user", content=request.transcript),
                ConversationMessage(
                    role="assistant",
                    content="コマンドを実行しました（モック実装）"
                ),
            ],
        )
        
        return mock_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

