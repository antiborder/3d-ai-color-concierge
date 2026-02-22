"""
Gemini API統合サービス
コマンド解析とチャットボット応答を処理
"""
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from google import generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
try:
    from google.api_core import exceptions as google_exceptions
except ImportError:
    # Fallback if google.api_core is not available
    google_exceptions = None

from app.api.schemas.voice import ConversationMessage, Command, ColorState
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Gemini API設定
genai.configure(api_key=settings.GEMINI_API_KEY)

# 安全設定（不適切なコンテンツのブロックを緩和）
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
}

# モデル設定
# Note: For google-generativeai 0.8.x, model names:
# - "gemini-3-flash-preview" (Gemini 3 Flash - preview, as per design document)
# - "gemini-pro" (stable fallback)
# - "gemini-1.5-pro" (if available)
# - "gemini-1.5-flash" (if available)
# Model name can be configured via GEMINI_MODEL_NAME environment variable
GENERATION_CONFIG = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 2048,
}


def build_system_prompt(language: str = "ja") -> str:
    """
    システムプロンプトを構築
    
    Args:
        language: 言語コード (ja/en)
    
    Returns:
        システムプロンプト文字列
    """
    from app.services.prompts.json_system import build_json_system_prompt
    return build_json_system_prompt(language)


def format_conversation_history(history: List[ConversationMessage]) -> str:
    """
    会話履歴を文字列形式に変換
    
    Args:
        history: 会話履歴のリスト
    
    Returns:
        フォーマットされた会話履歴文字列
    """
    if not history:
        return "No conversation history."
    
    formatted = []
    for msg in history:
        role_label = "User" if msg.role == "user" else "Assistant"
        formatted.append(f"{role_label}: {msg.content}")
    
    return "\n".join(formatted)


def format_current_color(color: ColorState) -> str:
    """
    現在の色状態を文字列形式に変換
    
    Args:
        color: 現在の色状態
    
    Returns:
        フォーマットされた色情報文字列
    """
    parts = []
    if color.r is not None and color.g is not None and color.b is not None:
        parts.append(f"RGB: ({color.r}, {color.g}, {color.b})")
    if color.c is not None and color.m is not None and color.y is not None and color.k is not None:
        parts.append(f"CMYK: ({color.c}, {color.m}, {color.y}, {color.k})")
    if color.h is not None and color.s is not None and color.l is not None:
        parts.append(f"HSL: ({color.h}, {color.s}, {color.l})")
    if color.h is not None and color.hsvS is not None and color.v is not None:
        parts.append(f"HSV: ({color.h}, {color.hsvS}, {color.v})")
    
    return ", ".join(parts) if parts else "No color information available"


def build_user_prompt(
    transcript: str,
    current_color: ColorState,
    conversation_history: List[ConversationMessage],
    language: str = "ja"
) -> str:
    """
    ユーザープロンプトを構築
    
    Args:
        transcript: 音声認識結果のテキスト
        current_color: 現在の色状態
        conversation_history: 会話履歴
        language: 言語コード
    
    Returns:
        ユーザープロンプト文字列
    """
    history_text = format_conversation_history(conversation_history)
    color_text = format_current_color(current_color)
    
    if language == "en":
        prompt = f"""Current color state: {color_text}

Conversation history:
{history_text}

User's current input: {transcript}

Please analyze the user's input and respond in JSON format as specified in the system prompt."""
    else:  # Japanese
        prompt = f"""現在の色状態: {color_text}

会話履歴:
{history_text}

ユーザーの現在の入力: {transcript}

ユーザーの入力を分析し、システムプロンプトで指定されたJSON形式で応答してください。"""
    
    return prompt


def parse_gemini_response(response_text: str) -> Dict[str, Any]:
    """
    Gemini APIのレスポンスをパース
    
    Args:
        response_text: Gemini APIからのレスポンステキスト
    
    Returns:
        パースされたレスポンス辞書
    
    Raises:
        ValueError: JSONパースに失敗した場合
    """
    original_text = response_text  # 元のテキストを保持
    
    # JSONコードブロックを除去
    response_text = response_text.strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]
    
    if response_text.endswith("```"):
        response_text = response_text[:-3]
    
    response_text = response_text.strip()
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        # エラー詳細をログ出力（長い場合は最初と最後の部分を出力）
        error_msg = f"JSON parse error: {str(e)}"
        if len(original_text) > 1000:
            logger.error(
                f"Failed to parse Gemini response as JSON. "
                f"Response length: {len(original_text)}. "
                f"First 500 chars: {original_text[:500]}... "
                f"Last 500 chars: ...{original_text[-500:]}"
            )
        else:
            logger.error(f"Failed to parse Gemini response as JSON: {original_text}")
        
        # 不完全なJSONを修復する試み（responseフィールドが途中で切れている場合）
        if "Unterminated string" in str(e) and '"response":' in response_text:
            try:
                # responseフィールドの値を空文字列に置き換えて修復を試みる
                import re
                # "response": "..." の部分を "response": "" に置き換え
                fixed_text = re.sub(r'"response":\s*"[^"]*$', '"response": ""', response_text)
                # 閉じ括弧を追加
                if not fixed_text.rstrip().endswith('}'):
                    fixed_text = fixed_text.rstrip() + '}'
                logger.warning(f"Attempting to fix incomplete JSON: {fixed_text}")
                return json.loads(fixed_text)
            except (json.JSONDecodeError, Exception) as fix_error:
                logger.error(f"Failed to fix incomplete JSON: {str(fix_error)}")
        
        raise ValueError(f"Invalid JSON response from Gemini: {error_msg}")


class GeminiService:
    """Gemini API統合サービス"""
    
    def __init__(self):
        """サービスを初期化"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set")
        
        # モデル名を設定から取得（デフォルトはgemini-3-flash-preview）
        model_name = settings.GEMINI_MODEL_NAME or "gemini-3-flash-preview"
        
        self.model = genai.GenerativeModel(
            model_name=model_name,
            safety_settings=SAFETY_SETTINGS,
            generation_config=GENERATION_CONFIG,
        )
    
    def process_voice_input(
        self,
        transcript: str,
        current_color: ColorState,
        conversation_history: List[ConversationMessage],
        language: str = "ja"
    ) -> Tuple[str, Optional[Command], Optional[str], List[ConversationMessage]]:
        """
        音声入力を処理してコマンドまたはチャットボット応答を返す
        
        Args:
            transcript: 音声認識結果のテキスト
            current_color: 現在の色状態
            conversation_history: 会話履歴
            language: 言語コード (ja/en)
        
        Returns:
            (response_type, command, response_text, updated_history) のタプル
            - response_type: "command" または "chatbot"
            - command: Commandオブジェクト（コマンドの場合）またはNone
            - response_text: チャットボット応答テキスト（チャットボットの場合）またはNone
            - updated_history: 更新された会話履歴
        
        Raises:
            ValueError: APIキーが設定されていない場合
            RuntimeError: Gemini API呼び出しに失敗した場合
        """
        try:
            # システムプロンプトとユーザープロンプトを構築
            system_prompt = build_system_prompt(language)
            user_prompt = build_user_prompt(transcript, current_color, conversation_history, language)
            
            # 完全なプロンプトを構築（システムプロンプト + ユーザープロンプト）
            full_prompt = f"{system_prompt}\n\n{user_prompt}"
            
            # 会話履歴がある場合は、履歴を含めてプロンプトを構築
            if conversation_history:
                history_text = format_conversation_history(conversation_history)
                full_prompt = f"{system_prompt}\n\n{history_text}\n\n{user_prompt}"
            
            # Gemini APIを呼び出し
            response = self.model.generate_content(full_prompt)
            response_text = response.text
            
            # レスポンス全体をログ出力（デバッグ用）
            logger.info(f"Gemini API response (length: {len(response_text)}): {response_text}")
            
            # レスポンスをパース
            parsed = parse_gemini_response(response_text)
            
            # レスポンスタイプに応じて処理
            response_type = parsed.get("type", "chatbot")
            command_dict = parsed.get("command")
            response_text = parsed.get("response")
            
            # Commandオブジェクトを作成（コマンドの場合）
            command = None
            if command_dict and response_type == "command":
                command = Command(
                    action=command_dict.get("action"),
                    parameters=command_dict.get("parameters", {})
                )
            
            # 会話履歴を更新
            updated_history = conversation_history.copy()
            updated_history.append(ConversationMessage(role="user", content=transcript))
            
            if response_type == "command":
                # コマンドの場合は、AIが生成した人間っぽいメッセージを使用
                # response_textがnullの場合はフォールバックメッセージを使用
                if response_text:
                    assistant_response = response_text
                else:
                    # フォールバック（通常は発生しない）
                    if language == "en":
                        assistant_response = f"Command executed: {command.action}"
                    else:
                        assistant_response = f"コマンドを実行しました: {command.action}"
            else:
                # チャットボットの場合は生成された応答を使用
                assistant_response = response_text or ""
            
            updated_history.append(ConversationMessage(role="assistant", content=assistant_response))
            
            return (response_type, command, response_text, updated_history)
        
        except Exception as api_error:
            error_str = str(api_error).lower()
            error_msg = str(api_error)
            
            # エラーメッセージに基づいて適切なエラーメッセージを設定
            if "api key" in error_str or "authentication" in error_str or "permission" in error_str:
                error_msg = "Authentication failed: Invalid or missing Gemini API key"
            elif "rate limit" in error_str or "quota" in error_str or "resource exhausted" in error_str:
                error_msg = "Rate limit exceeded: Please try again later"
            elif "timeout" in error_str or "deadline" in error_str:
                error_msg = "Request timeout: Gemini API did not respond in time"
            elif "invalid" in error_str or "bad request" in error_str:
                error_msg = f"Invalid request to Gemini API: {str(api_error)}"
            else:
                error_msg = f"Gemini API error: {str(api_error)}"
            
            logger.error(f"Gemini API error: {error_msg}", exc_info=True)
            raise RuntimeError(error_msg)
        
        except ValueError as e:
            # JSONパースエラーなど
            logger.error(f"Error parsing Gemini response: {str(e)}")
            raise RuntimeError(f"Failed to parse Gemini response: {str(e)}")
        
        except Exception as e:
            error_msg = f"Unexpected error calling Gemini API: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)
