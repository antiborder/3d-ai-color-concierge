"""SELECT_COLORS — 複数のDBカラーを選択してhistoryに追加し、3D空間にラベル表示するツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "SELECT_COLORS",
        "description": (
            "Select up to 12 colors from the database and display them as labeled markers "
            "in the 3D color space. All selected colors are added to the color history. "
            "The focus sphere moves to the last color in the list. "
            "IMPORTANT: You must ONLY use colors that exist in the color database. "
            "Before calling this tool, always call SEARCH_COLOR to find the actual registered "
            "colors and their exact names. Use the RGB values and name (name1 or name2) returned "
            "by SEARCH_COLOR as-is — do NOT invent RGB values or create new label names. "
            "Use this to visually explain: primary colors (三原色), analogous colors (類似色), "
            "neighboring colors (近隣色), tone-matching colors (トンマナ), "
            "background/text color suggestions, contrasting colors (対照的な色), "
            "or colors with adjusted saturation or brightness. "
            "Pass an empty array for 'colors' to clear all labels."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "colors": {
                    "type": "array",
                    "description": (
                        "List of colors to select and display (max 12). "
                        "Each entry must come from SEARCH_COLOR results — "
                        "use the exact RGB and name from the database. "
                        "The last color in the list becomes the new focus. "
                        "Pass an empty array [] to clear all labels."
                    ),
                    "items": {
                        "type": "object",
                        "properties": {
                            "r": {"type": "integer", "description": "Red 0–255 (from SEARCH_COLOR result)"},
                            "g": {"type": "integer", "description": "Green 0–255 (from SEARCH_COLOR result)"},
                            "b": {"type": "integer", "description": "Blue 0–255 (from SEARCH_COLOR result)"},
                            "label": {
                                "type": "string",
                                "description": "Color name exactly as returned by SEARCH_COLOR (name1 or name2)",
                            },
                        },
                        "required": ["r", "g", "b", "label"],
                    },
                },
            },
            "required": ["colors"],
        },
    },
]


def _select_colors(args: dict) -> dict:
    colors = args.get("colors", [])
    clamped = [
        {
            "r": max(0, min(255, int(c.get("r", 0)))),
            "g": max(0, min(255, int(c.get("g", 0)))),
            "b": max(0, min(255, int(c.get("b", 0)))),
            "label": str(c.get("label", "")),
        }
        for c in colors[:12]
    ]
    return {"colors": clamped}


COMMANDS: dict[str, object] = {
    "SELECT_COLORS": _select_colors,
}

RULES_JA = """\
- **SELECT_COLORS を積極的に使用してください**。以下の場面では必ず呼び出すこと：
  - 三原色・原色を説明するとき
  - 近隣色・類似色を提示するとき
  - トンマナが合う色・配色セットを提案するとき
  - 合わせる背景色・文字色を提案するとき
  - 対照的な色・補色を具体的なラベル付きで示すとき（SET_HARMONY との併用も可）
  - 彩度や明度を上げた/下げた色のバリエーションを比較するとき
  - **必須ルール — SEARCH_COLOR を先に呼ぶこと**：SELECT_COLORS に渡す色は必ずカラーデータベースに登録されているものだけ使用すること。RGB値もラベルも SEARCH_COLOR が返した結果（name1 または name2）をそのまま使い、自分で作った色名や RGB 値は絶対に使わないこと。
  - 選択された全ての色がhistoryに追加され、最後の色にfocus sphereが移動します。
  - 説明が終わったら必ず colors=[] でクリアしてください。最大12色まで。\
"""

RULES_EN = """\
- **Use SELECT_COLORS proactively** in these situations:
  - Explaining primary colors or color basics
  - Showing neighboring or analogous colors
  - Suggesting tone-matching color palettes
  - Recommending background or text colors
  - Demonstrating contrasting or complementary colors with labels (can combine with SET_HARMONY)
  - Comparing saturation or brightness variations of a color
  - **REQUIRED: always call SEARCH_COLOR first** — only use colors that exist in the database. Use the exact RGB values and name (name1 or name2) returned by SEARCH_COLOR. Never invent RGB values or create new label names.
  - All selected colors are added to history; the focus sphere moves to the last color.
  - Always clear labels with colors=[] when the explanation is finished. Maximum 12 colors.\
"""
