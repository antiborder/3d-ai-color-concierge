"""SELECT_COLOR / SET_COLOR / SET_HEX / SWITCH_CURSOR — 色の選択・直接指定・カーソル切替ツール群。"""

from __future__ import annotations

_TARGET_PROP = {
    "target": {
        "type": "string",
        "enum": ["focused", "background"],
        "description": (
            "Which cursor to apply the color to. "
            "'focused' = the Focused Color cursor (default when uiContext.colorTarget is 'focused'). "
            "'background' = the Background Color cursor. "
            "When the user explicitly mentions 'background' or 'background color', use 'background'. "
            "When ambiguous, use the current uiContext.colorTarget value."
        ),
    }
}

DECLARATIONS: list[dict] = [
    {
        "name": "SELECT_COLOR",
        "description": (
            "Select a specific RGB color by name or description. You MUST provide all three RGB values (r, g, b). "
            "For example: white = (255, 255, 255), black = (0, 0, 0), red = (255, 0, 0). "
            "Use this tool when the user asks to select a color by name or description. "
            "Set 'target' to 'background' when the user explicitly refers to the background color, "
            "otherwise use the current uiContext.colorTarget value."
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
            "For color selection by name (e.g., 'white', 'black'), use SELECT_COLOR instead. "
            "Set 'target' based on uiContext.colorTarget or explicit user mention."
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
            "Use this when the user specifies a color by its hex code. "
            "Set 'target' based on uiContext.colorTarget or explicit user mention."
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
- **カーソルの概念**: このアプリには2つのカーソルがあります。
  - **Focused Color カーソル**（円形のワイヤーフレーム）: ユーザーが選んでいる主たる色。
  - **Background Color カーソル**（別の球体のワイヤーフレーム）: 3Dキャンバスの背景色。
  - 現在どちらが選択されているかは `uiContext.colorTarget`（"focused" または "background"）で確認できます。
  - 起動直後は Focused Color と Background Color が連動しています（同じ色）。

- **色変更コマンドの target 決定ルール**:
  - ユーザーが「背景」「背景色」「background」と明示 → `target: "background"`
  - ユーザーが「フォーカス」「選択色」「focused color」と明示 → `target: "focused"`
  - 曖昧な場合（例：「緑にして」）→ `uiContext.colorTarget` の値をそのまま使う

- **ユーザーが色を指定した場合、まず SEARCH_COLOR を呼び出し、その後以下の判断をしてください。逆質問は絶対にしないこと。**

  **① 一意に特定できる色 → SELECT_COLOR**
  固有の色名・具体的な形容詞+色名・HEXコードを指定した場合（例：「クリムゾンにして」「深い緑を選んで」「スカーレット」）：
  SEARCH_COLOR の結果から最も適切な1色を選んで SELECT_COLOR を実行してください。選んだ後に「〇〇を選びました」と一言添えてください。

  **② 色カテゴリ・色系統 → SHOW_COLOR_LABELS**
  色の系統・カテゴリを指定した場合（例：「赤い色をお願いします」「青系の色」「暖かい色」「緑っぽい色」）：
  SEARCH_COLOR の結果から代表的な色を **3〜5色** 選んで SHOW_COLOR_LABELS で表示してください。

- **SELECT_COLOR の直後に、必ず CHANGE_SHAPE を呼んで色空間を切り替えてください。** 色の特性に応じて以下の色空間を選んでください：
  - ほぼ白（明度90%以上）・グレー系 → HSL
  - 純粋な原色（R/G/Bのいずれか1チャンネルのみ）→ RGB
  - シアン・マゼンタ・イエローの純粋な二次色 → CMYK
  - それ以外（大多数の色）→ HSB
- **純粋な三原色（#FF0000, #0000FF, #00FF00 など）は、三原色の説明をしている文脈以外では選ばないこと。**
- ユーザーが HEX コードで色を指定した場合（例：「#FF5733 にして」）は、SET_HEX を呼び出し、その後 CHANGE_SHAPE を呼んでください。
- 明度・彩度・色相の調整には絶対に SELECT_COLOR を使用しないでください。SELECT_COLOR は色名や説明で新しい色を選ぶ場合のみ使用してください。
- SET_COLOR は r/g/b の個別チャンネルを直接調整する場合のみ使用してください。色名での選択には使わないこと。\
"""

RULES_EN = """\
- **Cursor concept**: This app has two cursors, each tracked by a wireframe sphere in 3D space.
  - **Focused Color cursor** (circle wireframe): the user's primary selected color.
  - **Background Color cursor** (separate sphere wireframe): the 3D canvas background color.
  - Check `uiContext.colorTarget` ("focused" or "background") to know which is currently active.
  - On startup, Focused Color and Background Color are linked (same color).

- **Target resolution rules for color commands**:
  - User explicitly mentions "background", "background color" → `target: "background"`
  - User explicitly mentions "focused", "selected color", "focused color" → `target: "focused"`
  - Ambiguous (e.g., "make it green") → use the current `uiContext.colorTarget` value

- **When the user specifies a color, first call SEARCH_COLOR, then apply the following decision. Never ask a follow-up question.**

  **① A uniquely identifiable color → SELECT_COLOR**
  When the user names a specific color or uses a precise description (e.g., "crimson", "deep green", "scarlet", "#FF5733"):
  Pick the single best match from SEARCH_COLOR results and call SELECT_COLOR. Announce what you picked after selecting.

  **② A color category or family → SHOW_COLOR_LABELS**
  When the user specifies a broad color category (e.g., "a red color", "something blue", "warm colors", "show me some greens", "I want red"):
  Pick **3–5 representative colors** from SEARCH_COLOR results and display them with SHOW_COLOR_LABELS.

- **Immediately after SELECT_COLOR, always call CHANGE_SHAPE** to switch to the best color space for that color:
  - Near-white (lightness ≥ 90%) or grays → HSL
  - Pure primaries (only one of R/G/B dominant) → RGB
  - Pure CMY secondaries (cyan, magenta, yellow) → CMYK
  - Everything else (the majority of colors) → HSB
- **Never pick pure primaries (#FF0000, #0000FF, #00FF00, etc.) outside of a color theory explanation context.**
- If the user specifies a color by its hex code (e.g. "set color to #FF5733"), call SET_HEX followed by CHANGE_SHAPE.
- NEVER use SELECT_COLOR for brightness/saturation/hue adjustments. SELECT_COLOR is ONLY for selecting a new color by name or description.
- SET_COLOR is ONLY for adjusting individual RGB channels (r/g/b). Never use it to select a color by name.\
"""
