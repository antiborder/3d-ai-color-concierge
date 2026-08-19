"""SELECT_COLOR / SET_COLOR / SET_HEX / SWITCH_CURSOR — 色の選択・直接指定・カーソル切替ツール群。"""

from __future__ import annotations

_TARGET_PROP = {
    "target": {
        "type": "string",
        "enum": ["focused", "background"],
        "description": (
            "Which cursor to apply to. 'background' if the user explicitly says 'background'/'background color', "
            "otherwise use the current uiContext.colorTarget."
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


def _select_color(args: dict) -> dict:
    r = int(args.get("r", 0))
    g = int(args.get("g", 0))
    b = int(args.get("b", 0))
    target = args.get("target", "focused")
    return {"color": {"r": r, "g": g, "b": b}, "target": target}


def _set_color(args: dict) -> dict:
    result = {k: int(args[k]) for k in ("r", "g", "b") if k in args}
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
- **カーソルの概念**: 2つのカーソルがある — **Focused Color**（円形ワイヤーフレーム、主たる選択色）と **Background Color**（別の球体ワイヤーフレーム、3D背景色）。現在どちらが選択中かは `uiContext.colorTarget`（"focused"/"background"）で確認。起動直後は両者が連動（同色）。

- **target決定ルール**: 「背景/background」を明示→`target: "background"`。「フォーカス/選択色/focused」を明示→`target: "focused"`。曖昧なら `uiContext.colorTarget` の値をそのまま使う。

- **色指定時はまず SEARCH_COLOR を呼び、以下で判断する（逆質問は絶対にしない）**：

  **① 一意に特定できる色 → SELECT_COLOR**（例：「クリムゾンにして」「深い緑を選んで」）
  SEARCH_COLOR の結果から最適な1色を選んで SELECT_COLOR を実行し、「〇〇を選びました」と一言添える。

  **② 色カテゴリ・系統 → SHOW_COLOR_LABELS**（例：「赤い色をお願いします」「青系の色」「暖かい色」）
  SEARCH_COLOR の結果から代表色を **3〜5色** 選んで SHOW_COLOR_LABELS で表示する。

- **SELECT_COLOR の直後は必ず CHANGE_SHAPE で色空間を切り替える**：ほぼ白（明度90%以上）・グレー系 → HSL、純粋な原色（R/G/Bいずれか1チャンネルのみ）→ RGB、シアン/マゼンタ/イエローの純粋二次色 → CMYK、それ以外（大多数）→ HSB。
- **純粋な三原色（#FF0000, #0000FF, #00FF00 等）は三原色の説明文脈以外で選ばないこと。**
- HEXコード指定（例：「#FF5733にして」）は SET_HEX を呼び、続けて CHANGE_SHAPE を呼ぶ。
- 明度・彩度・色相の調整に SELECT_COLOR は絶対に使わない（色名・説明での新規選択専用）。
- SET_COLOR は r/g/b の個別チャンネル直接調整専用。色名での選択には使わない。\
"""

RULES_EN = """\
- **Cursor concept**: two cursors — **Focused Color** (circle wireframe, primary selected color) and **Background Color** (separate sphere wireframe, 3D canvas background). Check `uiContext.colorTarget` ("focused"/"background") for the active one. On startup both are linked (same color).

- **Target resolution**: explicit "background"/"background color" → `target: "background"`. Explicit "focused"/"selected color" → `target: "focused"`. Ambiguous (e.g. "make it green") → use current `uiContext.colorTarget`.

- **When the user specifies a color, first call SEARCH_COLOR, then decide (never ask a follow-up question)**:

  **① Uniquely identifiable color → SELECT_COLOR** (e.g. "crimson", "deep green", "#FF5733")
  Pick the single best match from SEARCH_COLOR results, call SELECT_COLOR, and announce what you picked.

  **② Color category/family → SHOW_COLOR_LABELS** (e.g. "a red color", "warm colors")
  Pick **3–5 representative colors** from SEARCH_COLOR results and display with SHOW_COLOR_LABELS.

- **Immediately after SELECT_COLOR, always call CHANGE_SHAPE**: near-white (lightness ≥90%)/grays → HSL, pure primaries (one of R/G/B dominant) → RGB, pure CMY secondaries → CMYK, everything else (majority) → HSB.
- **Never pick pure primaries (#FF0000, #0000FF, #00FF00, etc.) outside a color theory context.**
- Hex code specified (e.g. "#FF5733") → SET_HEX, then CHANGE_SHAPE.
- NEVER use SELECT_COLOR for brightness/saturation/hue adjustments — it's ONLY for selecting a new color by name or description.
- SET_COLOR is ONLY for adjusting individual RGB channels — never for selecting by name.\
"""
