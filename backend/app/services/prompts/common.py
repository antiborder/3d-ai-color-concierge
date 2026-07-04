"""
共通プロンプト部分
知識ベース、コミュニケーションスタイル、色選択ルールなどの共通部分を定義
"""

import logging

from app.services.color_service import ColorService

logger = logging.getLogger(__name__)

# ColorServiceのシングルトンインスタンス（プロンプト生成用）
_color_service_for_prompt: ColorService | None = None


def get_color_service_for_prompt() -> ColorService | None:
    """プロンプト生成用のColorServiceインスタンスを取得"""
    global _color_service_for_prompt
    if _color_service_for_prompt is None:
        try:
            _color_service_for_prompt = ColorService()
        except Exception as e:
            logger.warning(f"Failed to load color service for prompt: {e}")
    return _color_service_for_prompt


def get_color_database_summary(language: str = "ja") -> str:
    """色データベースの要約を取得。英語モードでは日本の伝統色を除外する。"""
    exclude_tags = ["JAPANESE"] if language == "en" else []
    try:
        color_service = get_color_service_for_prompt()
        if color_service:
            return color_service.get_summary_for_prompt(
                max_colors_per_category=15, exclude_tags=exclude_tags
            )
    except Exception as e:
        logger.warning(f"Failed to get color summary for prompt: {e}")
    if language == "en":
        return "Color database is available (CSS Named Colors, Material Design Colors)"
    return "Color database is available (CSS Named Colors, Material Design Colors, Japanese Traditional Colors)"


def get_knowledge_base_section(language: str) -> str:
    """
    知識ベースセクションを生成

    Args:
        language: 言語コード (ja/en)

    Returns:
        知識ベースセクションのテキスト
    """
    if language == "en":
        return """# Knowledge Base (Theoretical Foundation)
**IMPORTANT**: The following theoretical background should ONLY be included when the user asks questions or requests advice.
When executing commands (color selection, brightness adjustment, etc.), do NOT include any theoretical explanations. Respond briefly and concisely.

Only when the user asks questions related to the following topics, include the following theoretical background as either "hidden seasoning" or "direct explanation":

1. Visual Psychology
- Leverage the depth of 3D space to explain the characteristics of advancing colors (warm colors, high saturation) and receding colors (cool colors, low saturation).
- Include explanations of the emotional impact of color temperature and color psychology on users (e.g., blue's trustworthiness, orange's friendliness).

# 2. Color Three Attributes and PCCS Tones
# - Refer to colors not just as "light/dark" but use PCCS tone names like "Pale Tone" or "Dark Tone".
# - Be aware of coordinates in 3D space (HSL/HSB) and professionally evaluate the balance of saturation and brightness.

# 3. Color Harmony Theory (Geometric Approach)
# - Based on placement in 3D space, propose color harmony techniques like Diad (complementary), Triad (equilateral triangle), or Tetrad (square).
# - For complex color selection, recommend sophisticated "Split Complementary" schemes.

# 4. Accessibility and Functionality
# - Always consider WCAG 2.1 contrast ratio standards for relationships between text and background colors.
# - Provide advice on area ratios based on the golden ratio of color (70:25:5).

"""
    else:  # Japanese
        return """# Knowledge Base (理論武装)
**重要**: 下記の理論的背景は、ユーザーが質問やアドバイスを求めた場合のみ含めてください。
コマンド実行時（色選択、明度調整など）には、理論的説明は一切含めず、短く簡潔に応答してください。

ユーザーが質問した場合のみ、以下の理論的背景を「隠し味」または「直接的な解説」として含めてください：

1. 視覚心理
- 3D空間の奥行きを活かし、進出色（暖色・高彩度）と後退色（寒色・低彩度）の特性を解説してください。
- 色温度や色彩心理がユーザーに与える情動的影響（例：青の信頼感、オレンジの親近感）を説明に含めてください。

2. 配色理論（幾何学的アプローチ）
- 3D空間上の配置に基づき、ダイアード（補色）、トライアド（正三角形）、テトラード（正方形）などの配色技法を提案してください。
- 複雑な色選びには、洗練された「スプリットコンプリメンタリー」を推奨してください。

4. アクセシビリティと機能性
- 文字色と背景色の関係では、常にWCAG 2.1基準のコントラスト比を意識してください。
- 配色の黄金比率（70:25:5）に基づき、面積比のアドバイスを行ってください。

"""


def get_material_design_context_section(language: str) -> str:
    """
    Material Design & CSS Colors コンテキストセクションを生成

    Args:
        language: 言語コード (ja/en)

    Returns:
        Material Design & CSS Colors セクションのテキスト
    """
    if language == "en":
        return """# Specific Context (Material Design & CSS Colors)
- The app displays "Material Design Colors" and "CSS Named Colors".
- For Material Design colors, mention their "role" (Primary, On-Primary, etc.).
- For CSS Named Colors (AliceBlue, Tomato, etc.), connect them to implementation convenience.

# Available Color Database
The application has access to a comprehensive color database including CSS Named Colors and Material Design Colors. When users ask about specific colors, you can reference these colors by name. The database includes:
{color_summary}

When suggesting colors or answering questions about colors, you can mention specific color names from this database. For example, if a user asks about "red colors", you can mention specific shades like "Red 500" (Material Design) or "Crimson" (CSS Named Color).
"""
    else:  # Japanese
        return """# Specific Context (Material Design & CSS Colors)
- アプリ内には「Material Design Colors」と「CSS Named Colors」が表示されています。
- Material Designの色に対しては、その「役割（Primary, On-Primary等）」に言及してください。
- CSS Named Colors（AliceBlue, Tomato等）に対しては、実装時の利便性と結びつけて話してください。

# 利用可能な色データベース
アプリケーションには包括的な色データベースが登録されています。ユーザーが特定の色について質問した場合、これらの色名を参照できます。データベースには以下の色が含まれています：
{color_summary}

色を提案したり、色に関する質問に答える際は、このデータベースの具体的な色名を言及できます。例えば、ユーザーが「赤い色」について尋ねた場合、「Red 500」（Material Design）や「Crimson」（CSS Named Color）などの具体的な色名を挙げることができます。
"""


