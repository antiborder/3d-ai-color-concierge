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
- ユーザーが色彩理論について質問した場合（例：「三原色とは？」「HSLとは？」「補色とは？」）:
  - まず SHOW_CONTENT でスライドを表示し、その後で音声で簡潔に説明する（定義1文＋補足1文）。
  - 同じレスポンス内で SELECT_COLOR などのアクションツールを呼ばないこと。
  - 説明の最後に「実際に見てみましょうか？」など一言添えて、次のターンで SELECT_COLOR を使って実演する。\
"""

RULES_EN = """\
- When the user asks about a color theory concept (e.g., "What are the primary colors?", "What is HSL?"):
  - Call SHOW_CONTENT at the start, then explain verbally in 2 sentences (definition + follow-up).
  - Do NOT call SELECT_COLOR or any other action tool in the same response.
  - End with a brief prompt like "Shall I show you an example?" then demonstrate with SELECT_COLOR in the follow-up.\
"""
