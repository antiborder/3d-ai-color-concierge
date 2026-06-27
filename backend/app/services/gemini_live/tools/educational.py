"""SHOW_CONTENT — 色彩理論の教育コンテンツを表示するツール。"""

from __future__ import annotations

CONTENT_IDS = [
    "rgb_primary",  # 光の三原色と加法混色
    "cmy_primary",  # 色材の三原色と減法混色
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
            "cmy_primary: primary colors of pigment (cyan, magenta, yellow) and subtractive color mixing."
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
  - 利用可能なスライド: rgb_primary（光の三原色・加法混色）、cmy_primary（色材の三原色・減法混色）。
  - HSL・Lab・LCH・補色・トーンなど、スライドが存在しないトピックでは SHOW_CONTENT を呼ばないこと。
  - スライドを表示する場合は、まず SHOW_CONTENT を呼び、その後で音声で簡潔に説明する（定義1文＋補足1文）。
  - 同じレスポンス内で SELECT_COLOR などのアクションツールを呼ばないこと。\
"""

RULES_EN = """\
- Only call SHOW_CONTENT when the user's question matches a topic that has an available slide.
  - Available slides: rgb_primary (primary colors of light / additive mixing), cmy_primary (primary colors of pigment / subtractive mixing).
  - Do NOT call SHOW_CONTENT for topics without a slide (e.g., HSL, Lab, LCH, complementary colors, tones, etc.).
  - When showing a slide, call SHOW_CONTENT first, then explain verbally in 2 sentences.
  - Do NOT call SELECT_COLOR or any other action tool in the same response as SHOW_CONTENT.\
"""
