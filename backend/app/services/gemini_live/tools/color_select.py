"""SELECT_COLOR / SET_COLOR / SET_HEX — 色の選択・直接指定ツール群。"""

from __future__ import annotations

from ._color_math import determine_optimal_color_space

DECLARATIONS: list[dict] = [
    {
        "name": "SELECT_COLOR",
        "description": (
            "Select a specific RGB color by name or description. You MUST provide all three RGB values (r, g, b). "
            "For example: white = (255, 255, 255), black = (0, 0, 0), red = (255, 0, 0). "
            "Use this tool when the user asks to select a color by name or description."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "r": {"type": "integer", "minimum": 0, "maximum": 255},
                "g": {"type": "integer", "minimum": 0, "maximum": 255},
                "b": {"type": "integer", "minimum": 0, "maximum": 255},
            },
            "required": ["r", "g", "b"],
        },
    },
    {
        "name": "SET_COLOR",
        "description": (
            "Set one or more RGB channels directly for fine-tuning. "
            "This is for adjusting individual channels (r/g/b), NOT for selecting colors by name. "
            "For color selection by name (e.g., 'white', 'black'), use SELECT_COLOR instead."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "r": {"type": "integer", "minimum": 0, "maximum": 255},
                "g": {"type": "integer", "minimum": 0, "maximum": 255},
                "b": {"type": "integer", "minimum": 0, "maximum": 255},
            },
        },
    },
    {
        "name": "SET_HEX",
        "description": "Set the current color directly from a HEX code (e.g. '#FF5733' or 'FF5733'). Use this when the user specifies a color by its hex code.",
        "parameters": {
            "type": "object",
            "properties": {
                "hex": {
                    "type": "string",
                    "description": "6-digit hex color code, with or without '#' prefix (e.g. '#FF5733' or 'FF5733').",
                }
            },
            "required": ["hex"],
        },
    },
]


def _select_color(args: dict) -> dict:
    r = int(args.get("r", 0))
    g = int(args.get("g", 0))
    b = int(args.get("b", 0))
    return {
        "color": {"r": r, "g": g, "b": b},
        "optimalColorSpace": determine_optimal_color_space(r, g, b),
    }


def _set_color(args: dict) -> dict:
    return {k: int(args[k]) for k in ("r", "g", "b") if k in args}


def _set_hex(args: dict) -> dict:
    return {"hex": args.get("hex")}


COMMANDS: dict[str, object] = {
    "SELECT_COLOR": _select_color,
    "SET_COLOR": _set_color,
    "SET_HEX": _set_hex,
}

RULES_JA = """\
- **ユーザーが色を「選んで」「にして」と指示した場合**（例：「青を選んで」「暖かい色にして」「青っぽい色を選んで」）：即座に SEARCH_COLOR を呼び出し、最も代表的な1色を選んで SELECT_COLOR を実行してください。どれにするか逆質問してはいけません。選んだ後に「〇〇を選びました」と一言添えてください。代表色の選び方：「blue」なら "Blue" や "Blue 500"、「pink」なら "Pink 500" など、最も基本的な色名を優先してください。
- ユーザーが HEX コードで色を指定した場合（例：「#FF5733 にして」）は、SET_HEX を呼び出してください。
- 明度・彩度・色相の調整には絶対に SELECT_COLOR を使用しないでください。SELECT_COLOR は色名や説明で新しい色を選ぶ場合のみ使用してください。\
"""

RULES_EN = """\
- **When the user asks to SELECT a color by name or description** (e.g., "select blue", "choose something warm", "pick a bluish color"): call SEARCH_COLOR immediately, then pick the single most representative result and call SELECT_COLOR right away — do NOT ask the user which one they want. Just choose the most canonical match (e.g., "blue" → pick "Blue" or "Blue 500", not "sky blue" or "powder blue"). Announce what you picked after selecting.
- If the user specifies a color by its hex code (e.g. "set color to #FF5733"), call SET_HEX with the hex value.
- NEVER use SELECT_COLOR for brightness/saturation/hue adjustments. SELECT_COLOR is ONLY for selecting a new color by name or description.\
"""
