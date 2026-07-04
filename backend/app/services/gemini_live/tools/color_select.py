"""SELECT_COLOR / SET_COLOR / SET_HEX — 色の選択・直接指定ツール群。"""

from __future__ import annotations

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
    return {"color": {"r": r, "g": g, "b": b}}


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
- **ユーザーが色を「選んで」「にして」と指示した場合**（例：「青を選んで」「暖かい色にして」「青っぽい色を選んで」）：即座に SEARCH_COLOR を呼び出し、最も適切な1色を選んで SELECT_COLOR を実行してください。どれにするか逆質問してはいけません。選んだ後に「〇〇を選びました」と一言添えてください。
  - **純粋な三原色（#FF0000, #0000FF, #00FF00 など）は、三原色の説明をしている文脈以外では選ばないこと。** SEARCH_COLOR の結果から、なるべく多様な色を選んでください。
- **SELECT_COLOR の直後に、必ず CHANGE_SHAPE を呼んで色空間を切り替えてください。** 色の特性に応じて以下の色空間を選んでください：
  - ほぼ白（明度90%以上）・グレー系 → HSL
  - 純粋な原色（R/G/Bのいずれか1チャンネルのみ）→ RGB
  - シアン・マゼンタ・イエローの純粋な二次色 → CMYK
  - それ以外（大多数の色）→ HSB
- ユーザーが HEX コードで色を指定した場合（例：「#FF5733 にして」）は、SET_HEX を呼び出し、その後 CHANGE_SHAPE を呼んでください。
- 明度・彩度・色相の調整には絶対に SELECT_COLOR を使用しないでください。SELECT_COLOR は色名や説明で新しい色を選ぶ場合のみ使用してください。
- SET_COLOR は r/g/b の個別チャンネルを直接調整する場合のみ使用してください。色名での選択には使わないこと。\
"""

RULES_EN = """\
- **When the user asks to SELECT a color by name or description** (e.g., "select blue", "choose something warm", "pick a bluish color"): call SEARCH_COLOR immediately, then pick the most fitting result and call SELECT_COLOR right away — do NOT ask the user which one they want. Announce what you picked after selecting.
  - **Never pick pure primaries (#FF0000, #0000FF, #00FF00, etc.) outside of a color theory explanation context.** Choose varied, interesting colors from the SEARCH_COLOR results.
- **Immediately after SELECT_COLOR, always call CHANGE_SHAPE** to switch to the best color space for that color:
  - Near-white (lightness ≥ 90%) or grays → HSL
  - Pure primaries (only one of R/G/B dominant) → RGB
  - Pure CMY secondaries (cyan, magenta, yellow) → CMYK
  - Everything else (the majority of colors) → HSB
- If the user specifies a color by its hex code (e.g. "set color to #FF5733"), call SET_HEX followed by CHANGE_SHAPE.
- NEVER use SELECT_COLOR for brightness/saturation/hue adjustments. SELECT_COLOR is ONLY for selecting a new color by name or description.
- SET_COLOR is ONLY for adjusting individual RGB channels (r/g/b). Never use it to select a color by name.\
"""
