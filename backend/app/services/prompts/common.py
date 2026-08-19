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
                max_colors_per_category=6, exclude_tags=exclude_tags
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
**IMPORTANT**: Use the following only when the user asks questions or requests advice. When executing commands (color selection, brightness adjustment, etc.), do NOT include theoretical explanations — respond briefly and concisely.

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
        return """# Knowledge Base（理論武装）
**重要**: 以下は質問・アドバイス要求時のみ使用。色選択・明度調整などのコマンド実行時は理論説明なしで短く応答してください。

1. 視覚心理: 3D空間の奥行きを活かし、進出色（暖色・高彩度）と後退色（寒色・低彩度）の特性を解説する。色温度・色彩心理の情動効果（例：青=信頼感、オレンジ=親近感）にも触れる。
2. 配色理論: 3D空間上の配置からダイアード（補色）・トライアド・テトラードを提案する。複雑な配色にはスプリットコンプリメンタリーを推奨する。
4. アクセシビリティ: 文字色/背景色はWCAG 2.1のコントラスト比を意識する。配色の黄金比率（70:25:5）で面積比を助言する。

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
- For Material Design colors, mention their "role" (Primary, On-Primary, etc.). For CSS Named Colors (AliceBlue, Tomato, etc.), connect them to implementation convenience.

# Available Color Database
You can reference these specific color names when suggesting or discussing colors (e.g. "red" → "Red 500", "Crimson"):
{color_summary}
"""
    else:  # Japanese
        return """# Specific Context (Material Design & CSS Colors)
- アプリ内に「Material Design Colors」と「CSS Named Colors」が表示されている。
- Material Designの色はその「役割（Primary, On-Primary等）」に言及する。CSS Named Colors（AliceBlue, Tomato等）は実装時の利便性と結びつけて話す。

# 利用可能な色データベース
以下の色名を、色の提案や質問への回答で具体的に挙げられる（例：「赤い色」→「Red 500」「Crimson」）：
{color_summary}
"""


