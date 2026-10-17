"""SELECT_COLOR / SET_COLOR / SET_HEX / SWITCH_CURSOR — 色の選択・直接指定・カーソル切替ツール群。"""

from __future__ import annotations

_TARGET_PROP = {
    "target": {
        "type": "string",
        "enum": ["focused", "background"],
        "description": (
            "Which cursor to apply to: 'background' only if the user talks about the background, "
            "otherwise 'focused'."
        ),
    }
}

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
                **_TARGET_PROP,
            },
            "required": ["r", "g", "b", "target"],
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
                **_TARGET_PROP,
            },
            "required": ["target"],
        },
    },
    {
        "name": "SET_HEX",
        "description": (
            "Set the color directly from a HEX code (e.g. '#FF5733' or 'FF5733'). "
            "Use this when the user specifies a color by its hex code."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "hex": {
                    "type": "string",
                    "description": "6-digit hex color code, with or without '#' prefix (e.g. '#FF5733' or 'FF5733').",
                },
                **_TARGET_PROP,
            },
            "required": ["hex", "target"],
        },
    },
    {
        "name": "SET_BACKGROUND_COLOR",
        "description": (
            "Set the Background Color cursor directly via a hex code. "
            "Use this as a shortcut when the user provides a hex code explicitly for the background. "
            "For color names or descriptions targeting the background, prefer SELECT_COLOR with target='background'."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "hex": {
                    "type": "string",
                    "description": "6-digit hex color code for the background, with or without '#' prefix (e.g. '#1A1A2E' or '1A1A2E').",
                }
            },
            "required": ["hex"],
        },
    },
    {
        "name": "SWITCH_CURSOR",
        "description": (
            "Switch the active cursor between 'focused' and 'background'. "
            "After switching, all subsequent color operations will target the new cursor "
            "unless they specify 'target' explicitly. "
            "Use this when the user says things like 'switch to background cursor', "
            "'edit the background now', or 'go back to focused color'."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "enum": ["focused", "background"],
                    "description": "The cursor to activate.",
                }
            },
            "required": ["target"],
        },
    },
]


def _channel(value) -> int:
    """0〜255 に収める（Gemini が範囲外の値を送ることがある）。"""
    try:
        return max(0, min(255, int(value)))
    except (TypeError, ValueError):
        return 0


def _select_color(args: dict) -> dict:
    r = _channel(args.get("r", 0))
    g = _channel(args.get("g", 0))
    b = _channel(args.get("b", 0))
    target = args.get("target", "focused")
    return {"color": {"r": r, "g": g, "b": b}, "target": target}


def _set_color(args: dict) -> dict:
    result = {k: _channel(args[k]) for k in ("r", "g", "b") if k in args}
    result["target"] = args.get("target", "focused")
    return result


def _set_hex(args: dict) -> dict:
    return {"hex": args.get("hex"), "target": args.get("target", "focused")}


def _set_background_color(args: dict) -> dict:
    return {"hex": args.get("hex")}


def _switch_cursor(args: dict) -> dict:
    return {"target": args.get("target", "focused")}


COMMANDS: dict[str, object] = {
    "SELECT_COLOR": _select_color,
    "SET_COLOR": _set_color,
    "SET_HEX": _set_hex,
    "SET_BACKGROUND_COLOR": _set_background_color,
    "SWITCH_CURSOR": _switch_cursor,
}

RULES_JA = """\
- **カーソルの概念**: 2つのカーソルがある — **Focused Color**（円形ワイヤーフレーム、主たる選択色）と **Background Color**（別の球体ワイヤーフレーム、3D背景色 = `uiContext.background`）。起動直後は背景が選択色に連動している（同色）。背景を個別に設定すると、連動は自動で解除される。

- **target決定ルール**: ユーザーが「背景」と言ったとき、または直前の背景の話の続き（「背景を暗くして」→「もう少し」）のときだけ `target: "background"`。それ以外は常に `target: "focused"`（`uiContext.colorTarget` が background のままでも、「〜を選んで」「〜にして」は選択色のこと）。
- 「今の色（選択色）を背景にして」→ SET_BACKGROUND_COLOR に選択色の HEX を渡す。「背景と選択色を入れ替えて」→ SET_HEX(target="focused") に今の背景の HEX、SET_BACKGROUND_COLOR に今の選択色の HEX。

- **色指定時はまず SEARCH_COLOR を呼び、以下で判断する（逆質問は絶対にしない）**：

  **① 色を選ぶ・変える依頼 → SELECT_COLOR**（例：「緑を選んで」「鮮やかな赤にして」「落ち着いた青を選んで」「クリムゾンにして」）
  「赤」「緑」のような基本色名や「落ち着いた〜」のような説明でも、選ぶ・変える依頼なら必ず1色に決めて SELECT_COLOR を実行する。候補を並べるだけで終わらせない。基本色名は、検索結果ではなく次の典型的な色を使う：赤 #E60033、オレンジ #EE7800、黄色 #FFD900、緑 #3EB370、水色 #68C3E6、青 #0068B7、紫 #884898、ピンク #F09199、茶色 #8F5E3C、灰色 #7D7D7D。データベースに無い色名（例：「ティファニーブルー」）は、自分の知識で代表的な色を決める（見つからなかったことを謝らない）。
  選んだ後は tool response の name を使って「〇〇を選びました」と一言で伝える（色の見た目を推測で言わない）。

  **② 候補を見たいという依頼 → SHOW_COLOR_LABELS**（例：「青系の色を見せて」「赤い色にはどんなのがある？」「春っぽい色をいくつか」）
  SEARCH_COLOR の結果から代表色を **3〜5色** 選んで SHOW_COLOR_LABELS で表示する。

- **SELECT_COLOR の直後は必ず CHANGE_SHAPE で色空間を切り替える**：ほぼ白（明度90%以上）・グレー系 → HSL、純粋な原色（R/G/Bいずれか1チャンネルのみ）→ RGB、シアン/マゼンタ/イエローの純粋二次色 → CMYK、それ以外（大多数）→ HSB。
- **純粋な三原色（#FF0000, #0000FF, #00FF00 等）は三原色の説明文脈以外で選ばないこと。**
- HEXコード指定（例：「#FF5733にして」）は SET_HEX を呼び、続けて CHANGE_SHAPE を呼ぶ。
- 明度・彩度・色相の調整に SELECT_COLOR は絶対に使わない（色名・説明での新規選択専用）。
- SET_COLOR は r/g/b の個別チャンネル直接調整専用。色名での選択には使わない。\
"""

RULES_EN = """\
- **Cursor concept**: two cursors — **Focused Color** (circle wireframe, primary selected color) and **Background Color** (separate sphere wireframe, 3D canvas background = `uiContext.background`). On startup the background follows the selected color (same color). Setting the background on its own ends that link automatically.

- **Target resolution**: `target: "background"` only when the user says "background", or continues talking about the background ("darken the background" → "a bit more"). Otherwise always `target: "focused"` (even when `uiContext.colorTarget` is still background, "pick X" / "make it X" means the selected color).
- "Make the current (selected) color the background" → SET_BACKGROUND_COLOR with the selected color's hex. "Swap the background and the selected color" → SET_HEX(target="focused") with the current background's hex, and SET_BACKGROUND_COLOR with the current selected color's hex.

- **When the user specifies a color, first call SEARCH_COLOR, then decide (never ask a follow-up question)**:

  **① A request to pick or change to a color → SELECT_COLOR** (e.g. "pick green", "make it a vivid red", "choose a calm blue", "crimson")
  Even for a basic name like "red" or "green", or a description like "a calm blue", decide on ONE color and call SELECT_COLOR. Never stop at showing candidates. For a basic name, use these typical colors rather than search results: red #E60033, orange #EE7800, yellow #FFD900, green #3EB370, light blue #68C3E6, blue #0068B7, purple #884898, pink #F09199, brown #8F5E3C, gray #7D7D7D. For a name not in the database (e.g. "Tiffany blue"), choose a typical color from your own knowledge (do not apologize that it was not found).
  Then announce it in one sentence using the name in the tool response (never describe the color by guess).

  **② A request to see options → SHOW_COLOR_LABELS** (e.g. "show me some blues", "what reds are there?", "a few spring colors")
  Pick **3–5 representative colors** from SEARCH_COLOR results and display with SHOW_COLOR_LABELS.

- **Immediately after SELECT_COLOR, always call CHANGE_SHAPE**: near-white (lightness ≥90%)/grays → HSL, pure primaries (one of R/G/B dominant) → RGB, pure CMY secondaries → CMYK, everything else (majority) → HSB.
- **Never pick pure primaries (#FF0000, #0000FF, #00FF00, etc.) outside a color theory context.**
- Hex code specified (e.g. "#FF5733") → SET_HEX, then CHANGE_SHAPE.
- NEVER use SELECT_COLOR for brightness/saturation/hue adjustments — it's ONLY for selecting a new color by name or description.
- SET_COLOR is ONLY for adjusting individual RGB channels — never for selecting by name.\
"""
