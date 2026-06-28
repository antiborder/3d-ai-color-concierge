"""SHOW_CONTENT — 色彩理論の教育コンテンツを表示するツール。"""

from __future__ import annotations

CONTENT_IDS = [
    "rgb_primary",  # 光の三原色と加法混色
    "cmy_primary",  # 色材の三原色と減法混色
    "hsb_space",    # HSB色空間（カラーホイール・彩度・明度）
    "hsl_space",    # HSL色空間（カラーホイール・彩度・輝度）
    "lab_space",    # Lab色空間（L*明度バー・a*b*平面）
]

DECLARATIONS: list[dict] = [
    {
        "name": "SHOW_CONTENT",
        "description": (
            "Display an educational slide to visually explain a color theory concept. "
            "Use this when the user asks about a color theory topic that benefits from visual explanation. "
            "Call SHOW_CONTENT at the START of your response, then deliver the verbal explanation. "
            "Do NOT call SELECT_COLOR or other action tools in the same response — "
            "reserve demonstrations for the follow-up after the user has seen the slide. "
            f"Available content IDs: {', '.join(CONTENT_IDS)}. "
            "rgb_primary: primary colors of light (red, green, blue) and additive color mixing. "
            "cmy_primary: primary colors of pigment (cyan, magenta, yellow) and subtractive color mixing. "
            "hsb_space: HSB color space — color wheel (hue), saturation (vividness), and brightness. "
            "hsl_space: HSL color space — color wheel (hue), saturation (vividness), and lightness (0=black, 0.5=vivid, 1=white). "
            "lab_space: Lab color space — L* lightness bar (black to white) and a*×b* chrominance plane (green↔red, blue↔yellow). "
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "enum": CONTENT_IDS,
                    "description": "Educational content ID to display.",
                }
            },
            "required": ["id"],
        },
    }
]


def _show_content(args: dict) -> dict:
    return {"id": args.get("id")}


COMMANDS: dict[str, object] = {
    "SHOW_CONTENT": _show_content,
}

RULES_JA = """\
- SHOW_CONTENT は、質問されたトピックに対応するスライドが存在する場合のみ使用すること。
  - 利用可能なスライド: rgb_primary（光の三原色・加法混色）、cmy_primary（色材の三原色・減法混色）、hsb_space（HSB色空間）、hsl_space（HSL色空間）、lab_space（Lab色空間）。
  - LCH・補色・トーンなど、スライドが存在しないトピックでは SHOW_CONTENT を呼ばないこと。
  - SHOW_CONTENT を呼ぶとスライドが自動表示されます。「スライドを表示します」「見てみましょう」などの文言は言わないこと。
  - スライドを表示する場合は、まず SHOW_CONTENT を呼び、その後で音声で簡潔に説明する（定義1文＋補足1文）。
  - CHANGE_SHAPE と SHOW_CONTENT は同じレスポンスで呼び出してよい。SELECT_COLOR は呼ばないこと。\
"""

RULES_EN = """\
- Only call SHOW_CONTENT when the user's question matches a topic that has an available slide.
  - Available slides: rgb_primary (primary colors of light / additive mixing), cmy_primary (primary colors of pigment / subtractive mixing), hsb_space (HSB color space), hsl_space (HSL color space), lab_space (Lab color space).
  - Do NOT call SHOW_CONTENT for topics without a slide (e.g., LCH, complementary colors, tones, etc.).
  - SHOW_CONTENT displays the slide automatically — do NOT say "let me show you a slide" or "here's a diagram". Call the tool, then explain directly.
  - When showing a slide, call SHOW_CONTENT first, then explain verbally in 2 sentences.
  - CHANGE_SHAPE and SHOW_CONTENT may be called together in the same response. Do NOT call SELECT_COLOR.\
"""
