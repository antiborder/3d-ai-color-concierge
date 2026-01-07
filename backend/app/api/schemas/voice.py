"""
音声処理APIのリクエスト/レスポンススキーマ
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ColorState(BaseModel):
    """現在の色状態"""
    r: int = Field(..., ge=0, le=255, description="Red value (0-255)")
    g: int = Field(..., ge=0, le=255, description="Green value (0-255)")
    b: int = Field(..., ge=0, le=255, description="Blue value (0-255)")
    c: Optional[int] = Field(None, ge=0, le=100, description="Cyan value (0-100)")
    m: Optional[int] = Field(None, ge=0, le=100, description="Magenta value (0-100)")
    y: Optional[int] = Field(None, ge=0, le=100, description="Yellow value (0-100)")
    k: Optional[int] = Field(None, ge=0, le=100, description="Key value (0-100)")
    h: Optional[int] = Field(None, ge=0, le=360, description="Hue value (0-360)")
    s: Optional[int] = Field(None, ge=0, le=100, description="Saturation value (0-100)")
    l: Optional[int] = Field(None, ge=0, le=100, description="Lightness value (0-100)")
    hsvS: Optional[int] = Field(None, ge=0, le=100, description="HSV Saturation value (0-100)")
    v: Optional[int] = Field(None, ge=0, le=100, description="Value (0-100)")


class ConversationMessage(BaseModel):
    """会話履歴のメッセージ"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class VoiceProcessRequest(BaseModel):
    """音声処理リクエスト"""
    transcript: str = Field(..., description="音声認識結果のテキスト")
    current_color: ColorState = Field(..., description="現在の色状態")
    conversation_history: List[ConversationMessage] = Field(
        default_factory=list,
        description="会話履歴（最大50件）"
    )
    language: str = Field(default="ja", description="言語コード (ja/en)")


class Command(BaseModel):
    """コマンドオブジェクト"""
    action: str = Field(..., description="コマンドアクション")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="コマンドパラメータ")


class VoiceProcessResponse(BaseModel):
    """音声処理レスポンス"""
    type: str = Field(..., description="レスポンスタイプ: 'command' or 'chatbot'")
    command: Optional[Command] = Field(None, description="コマンドオブジェクト（type='command'の場合）")
    response: Optional[str] = Field(None, description="チャットボット応答（type='chatbot'の場合）")
    updated_history: List[ConversationMessage] = Field(
        default_factory=list,
        description="更新された会話履歴"
    )

