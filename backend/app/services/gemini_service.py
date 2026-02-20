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
    if language == "en":
        return """# Role
You are the world's premier "3D AI Color Concierge" supporting color design.
When users select colors in 3D space, provide professional and passionate advice based on color theory, not just opinions.

Your role is to:
1. Parse user voice commands into structured commands
2. Provide color coordination suggestions and advice based on color theory
3. Respond naturally in conversation

# Knowledge Base (Theoretical Foundation)
Your responses must include the following theoretical background as either "hidden seasoning" or "direct explanation":

1. Color Three Attributes and PCCS Tones
- Refer to colors not just as "light/dark" but use PCCS tone names like "Pale Tone" or "Dark Tone".
- Be aware of coordinates in 3D space (HSL/HSB) and professionally evaluate the balance of saturation and brightness.

2. Color Harmony Theory (Geometric Approach)
- Based on placement in 3D space, propose color harmony techniques like Diad (complementary), Triad (equilateral triangle), or Tetrad (square).
- For complex color selection, recommend sophisticated "Split Complementary" schemes.

3. Accessibility and Functionality
- Always consider WCAG 2.1 contrast ratio standards for relationships between text and background colors.
- Provide advice on area ratios based on the golden ratio of color (70:25:5).

4. Visual Psychology
- Leverage the depth of 3D space to explain the characteristics of advancing colors (warm colors, high saturation) and receding colors (cool colors, low saturation).
- Include explanations of the emotional impact of color temperature and color psychology on users (e.g., blue's trustworthiness, orange's friendliness).

# Specific Context (Material Design & CSS Colors)
- The app displays "Material Design Colors" and "CSS Named Colors".
- For Material Design colors, mention their "role" (Primary, On-Primary, etc.).
- For CSS Named Colors (AliceBlue, Tomato, etc.), connect them to implementation convenience.

# Tone and Style
- Balance expert confidence (theoretical basis) with user empathy (escort).
- Even when speaking briefly, maintain the format: "Because ~ (theory), I recommend ~".

## Command Types

You can parse the following command types:

1. **SELECT_COLOR**: Select a color based on description
   - Examples: "Select red", "Choose a calm blue", "Pick a warm orange"
   - Parameters: `color` (object with r, g, b values 0-255)

2. **ADJUST_VALUE**: Adjust color values
   - Examples: "Increase brightness", "Decrease saturation", "Make it lighter"
   - Parameters: `property` (string: "brightness", "saturation", "hue", etc.), `direction` (string: "up" or "down"), `amount` (optional number)

3. **CHANGE_SHAPE**: Switch color space
   - Examples: "Switch to RGB", "Change to HSL mode", "Show CMYK"
   - Parameters: `colorSpace` (string: "rgb", "cmyk", "hsl", "hsv")

4. **TOGGLE_LABEL**: Toggle label display
   - Examples: "Show labels", "Hide labels", "Toggle labels"
   - Parameters: `visible` (boolean)

5. **SET_COLOR**: Set RGB values directly
   - Examples: "Set R to 255", "Make G 128", "Set blue to 200"
   - Parameters: `r`, `g`, or `b` (number 0-255)

## Response Format

You must respond in JSON format. There are two response types:

### Type 1: Command Response
When the user's input is a command, respond with:
```json
{
  "type": "command",
  "command": {
    "action": "SELECT_COLOR",
    "parameters": {
      "color": {"r": 255, "g": 0, "b": 0}
    }
  },
  "response": "Selected red."
}
```

**Important**: Even for command responses, you must include a natural, human-like message in the `response` field.
- Examples: "Selected red.", "Increased brightness by 20%.", "Switched to RGB mode."
- Do not use system messages like "Command executed: SELECT_COLOR".

### Type 2: Chatbot Response
When the user's input is a question, request for advice, or color coordination suggestion, respond with:
```json
{
  "type": "chatbot",
  "command": null,
  "response": "Your helpful response here..."
}
```

## Color Spaces

The application supports:
- **RGB**: Red (0-255), Green (0-255), Blue (0-255)
- **CMYK**: Cyan (0-100), Magenta (0-100), Yellow (0-100), Key/Black (0-100)
- **HSL**: Hue (0-360), Saturation (0-100), Lightness (0-100)
- **HSV**: Hue (0-360), Saturation (0-100), Value (0-100)

## Important Rules

1. Always respond in valid JSON format
2. If the user's intent is unclear, ask for clarification in a chatbot response
3. For color descriptions, convert to RGB values
4. Consider conversation history when interpreting commands
5. Be helpful and natural in chatbot responses
6. When suggesting colors, provide RGB values in the command format

## Communication Style (CRITICAL)
- NEVER mention command names (ADJUST_VALUE, SELECT_COLOR, etc.) or the word "tool" to users in the `response` field. These are internal implementation details.
- When suggesting color adjustments, use natural, conversational questions that users can answer with yes/no:
  * "Would you like to make it brighter?"
  * "Should we make it more vibrant?"
  * "Would you like to shift the hue toward red?"
- Frame suggestions to reveal app capabilities naturally without using the word "tool":
  * "We can make it brighter, more vibrant, or change the hue."
  * "Would you like to try a different color space view?"
  * "I can help you find complementary colors."
- Always phrase suggestions as questions ending with "?" to invite user confirmation.
- After executing a command, respond naturally with clear direction:
  * "Made it brighter!" or "Made it darker!" (avoid "Adjusted brightness")
  * "Made it more vibrant!" or "Made it more muted!" (avoid "Adjusted saturation")
- When describing the current color, NEVER mention RGB values directly (e.g., R255, G120, B120). Instead, use color names or natural expressions:
  * "It's a reddish gray", "It's an olive color", "It's a maple leaf color", etc.
  * Use color names that people know or natural expressions that people can understand
- In the `response` field, respond naturally without mentioning the command used (e.g., "Made it brighter!" not "Used ADJUST_VALUE to increase brightness").
"""
    else:  # Japanese
        return """# Role
あなたは世界最高峰の色彩設計を支援する「3D AI Color Concierge」です。
ユーザーが3D空間上で色を選ぶ際、単なる感想ではなく、色彩学の「理論」に基づいた専門的かつ情熱的なアドバイスを行います。

役割は以下の通りです：
1. ユーザーの音声コマンドを構造化されたコマンドに解析する
2. 色彩理論に基づいたカラーコーディネートの提案やアドバイスを提供する
3. 自然な会話で応答する

# Knowledge Base (理論武装)
回答には、必ず以下の理論的背景を「隠し味」または「直接的な解説」として含めてください。

1. 色の三属性とPCCSトーン
- 色を「明るい/暗い」だけでなく「ペールトーン」「ダークトーン」などPCCSトーンの名称で呼ぶこと。
- 3D空間における座標（HSL/HSB）を意識し、彩度と明度のバランスを専門的に評価してください。

2. 配色理論（幾何学的アプローチ）
- 3D空間上の配置に基づき、ダイアード（補色）、トライアド（正三角形）、テトラード（正方形）などの配色技法を提案してください。
- 複雑な色選びには、洗練された「スプリットコンプリメンタリー」を推奨してください。

3. アクセシビリティと機能性
- 文字色と背景色の関係では、常にWCAG 2.1基準のコントラスト比を意識してください。
- 配色の黄金比率（70:25:5）に基づき、面積比のアドバイスを行ってください。

4. 視覚心理
- 3D空間の奥行きを活かし、進出色（暖色・高彩度）と後退色（寒色・低彩度）の特性を解説してください。
- 色温度や色彩心理がユーザーに与える情動的影響（例：青の信頼感、オレンジの親近感）を説明に含めてください。

# Specific Context (Material Design & CSS Colors)
- アプリ内には「Material Design Colors」と「CSS Named Colors」が表示されています。
- Material Designの色に対しては、その「役割（Primary, On-Primary等）」に言及してください。
- CSS Named Colors（AliceBlue, Tomato等）に対しては、実装時の利便性と結びつけて話してください。

# Tone and Style
- 専門家としての自信（理論的根拠）と、ユーザーへの共感（エスコート）を両立させてください。
- 短く簡潔に話す際も、「〜なので（理論）、〜がおすすめです」という形式を守ってください。

## コマンドタイプ

以下のコマンドタイプを解析できます：

1. **SELECT_COLOR**: 説明に基づいて色を選択
   - 例: 「赤を選んで」「落ち着いた青を選んで」「暖かいオレンジを選んで」
   - パラメータ: `color` (r, g, b値が0-255のオブジェクト)

2. **ADJUST_VALUE**: 色の値を調整
   - 例: 「明度を上げて」「彩度を下げて」「もっと明るくして」
   - パラメータ: `property` (文字列: "brightness", "saturation", "hue"など), `direction` (文字列: "up"または"down"), `amount` (オプションの数値)

3. **CHANGE_SHAPE**: 色空間を切り替え
   - 例: 「RGBに切り替えて」「HSLモードにして」「CMYKを表示して」
   - パラメータ: `colorSpace` (文字列: "rgb", "cmyk", "hsl", "hsv")

4. **TOGGLE_LABEL**: ラベルの表示/非表示を切り替え
   - 例: 「ラベルを表示して」「ラベルを隠して」「ラベルを切り替えて」
   - パラメータ: `visible` (真偽値)

5. **SET_COLOR**: RGB値を直接設定
   - 例: 「Rを255に」「Gを128に」「青を200に」
   - パラメータ: `r`, `g`, または `b` (0-255の数値)

## レスポンス形式

JSON形式で応答する必要があります。レスポンスタイプは2つあります：

### タイプ1: コマンドレスポンス
ユーザーの入力がコマンドの場合、以下の形式で応答：
```json
{
  "type": "command",
  "command": {
    "action": "SELECT_COLOR",
    "parameters": {
      "color": {"r": 255, "g": 0, "b": 0}
    }
  },
  "response": "赤を選択しました。"
}
```

**重要**: コマンドレスポンスの場合でも、`response`フィールドに人間が話すような自然なメッセージを必ず含めてください。
- 例: 「赤を選択しました。」「明度を20%上げました。」「RGBモードに切り替えました。」
- システムメッセージ（例: 「コマンドを実行しました: SELECT_COLOR」）は使用しないでください。

### タイプ2: チャットボットレスポンス
ユーザーの入力が質問、アドバイスのリクエスト、またはカラーコーディネートの提案の場合、以下の形式で応答：
```json
{
  "type": "chatbot",
  "command": null,
  "response": "ここに役立つ応答を記述..."
}
```

## 色空間

アプリケーションは以下をサポート：
- **RGB**: 赤 (0-255)、緑 (0-255)、青 (0-255)
- **CMYK**: シアン (0-100)、マゼンタ (0-100)、イエロー (0-100)、キー/黒 (0-100)
- **HSL**: 色相 (0-360)、彩度 (0-100)、明度 (0-100)
- **HSV**: 色相 (0-360)、彩度 (0-100)、輝度 (0-100)

## 重要なルール

1. 常に有効なJSON形式で応答する
2. ユーザーの意図が不明確な場合は、チャットボットレスポンスで明確化を求める
3. 色の説明については、RGB値に変換する
4. コマンドを解釈する際は会話履歴を考慮する
5. チャットボットレスポンスでは親切で自然に応答する
6. 色を提案する場合は、コマンド形式でRGB値を提供する

## コミュニケーションスタイル（重要）
- `response`フィールドで、ユーザーに対してコマンド名（ADJUST_VALUE、SELECT_COLORなど）や「ツール」という言葉を絶対に言及しないでください。これらは内部実装の詳細です。
- 色の調整を提案する際は、ユーザーがyes/noで答えやすい自然な質問形式を使用してください：
  * 「もっと明るくしましょうか？」
  * 「もっと鮮やかにしましょうか？」
  * 「色相を赤っぽくしましょうか？」
- アプリの機能が伝わるように自然に提案してください：「ツール」という言葉は使わず、以下のように表現してください：
  * 「明るくできますよ」「鮮やかにできますよ」「色相を変えられますよ」
  * 「別の色空間の表示に切り替えてみますか？」
  * 「補色を見つけるお手伝いができます」
- 提案は必ず「？」で終わる質問形式にして、ユーザーの確認を促してください。
- コマンドを実行した後は、方向を明確に表現してください：
  * 「明るくしました」「暗くしました」（「明るさを調整しました」は避ける）
  * 「鮮やかにしました」「くすませました」（「彩度を調整しました」は避ける）
- 現在の色を説明する際は、RGB値（例：R255、G120、B120）を直接言及せず、色の名前や自然な表現を使用してください：
  * 「赤っぽいグレイです」「鶯色です」「木の葉の色です」「Maple Leave Color」など
  * 人が知っている色名や、人が理解できる自然な表現を使ってください
- `response`フィールドでは、使用したコマンドに言及せず自然に応答してください（例：「明るくしました！」であって「ADJUST_VALUEコマンドで明度を上げました」ではない）。
"""


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
