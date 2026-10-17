"""SET_BRIDGE_COLOR / SELECT_BRIDGE_POSITION — 1D Picker（カラーブリッジ）操作ツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "SELECT_BRIDGE_POSITION",
        "description": (
            "Select the color at a specific position along the 1D Picker (Color Bridge) gradient. "
            "The gradient runs from bridgeColorA (left, position=0.0) to bridgeColorB (right, position=1.0). "
            "Use this when the user says 'select the middle color', 'pick a right-leaning color', etc. "
            "The frontend interpolates in the color space on screen and selects the resulting color; "
            "the tool response gives its hex and closest name. "
            "Before calling this, you can call GET_UI_STATE to see the current bridgeColorA and bridgeColorB values."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "position": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 1.0,
                    "description": "Position along the gradient: 0.0=left (A), 0.5=center, 1.0=right (B).",
                },
            },
            "required": ["position"],
        },
    },
    {
        "name": "SET_BRIDGE_COLOR",
        "description": (
            "Set the left or right endpoint color of the 1D Picker (Color Bridge). "
            "The 1D Picker shows a gradient between two endpoint colors (left and right), "
            "letting the user explore colors along a straight line in 3D color space. "
            "Use this when the user asks to change the left/right color of the 1D Picker, "
            "or when you want to demonstrate a color transition. "
            "Always provide RGB values (0-255) for the chosen endpoint."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "side": {
                    "type": "string",
                    "enum": ["left", "right"],
                    "description": "Which endpoint to set: 'left' or 'right'.",
                },
                "r": {"type": "integer", "minimum": 0, "maximum": 255},
                "g": {"type": "integer", "minimum": 0, "maximum": 255},
                "b": {"type": "integer", "minimum": 0, "maximum": 255},
            },
            "required": ["side", "r", "g", "b"],
        },
    },
]


def _select_bridge_position(args: dict) -> dict:
    return {"position": float(args.get("position", 0.5))}


def _channel(value) -> int:
    """0〜255 に収める（Gemini が 1255 のような範囲外の値を送ることがある）。"""
    try:
        return max(0, min(255, int(value)))
    except (TypeError, ValueError):
        return 0


def _set_bridge_color(args: dict) -> dict:
    return {
        "side": args.get("side"),
        "r": _channel(args.get("r", 0)),
        "g": _channel(args.get("g", 0)),
        "b": _channel(args.get("b", 0)),
    }


COMMANDS: dict[str, object] = {
    "SELECT_BRIDGE_POSITION": _select_bridge_position,
    "SET_BRIDGE_COLOR": _set_bridge_color,
}

RULES_JA = """\
- **「AとBの中間の色」「AとBの真ん中は？」**：混色（MIX_COLORS）ではなく、表示中の色空間での中点を 1D Picker で選ぶ。SET_BRIDGE_COLOR(side="left", A) → SET_BRIDGE_COLOR(side="right", B) → SELECT_BRIDGE_POSITION(0.5) の順に呼ぶ。「今の色と白の中間」のように今の色が入るときは、今の色をその端に使う。結果は tool response の name で「〇〇色空間での中間は△△です」と答える。
- ユーザーが 1D Picker（カラーブリッジ）の左端・右端の色を変えるよう求めた場合は、SET_BRIDGE_COLOR を side="left" または side="right" と RGB値で呼び出してください。
- ユーザーが 1D Picker のグラデーション上の特定位置の色を選ぶよう求めた場合（例：「真ん中の色」「右寄りの色」「左端の色」）、SELECT_BRIDGE_POSITION を position（0.0=左端/A、0.5=中央、1.0=右端/B）で呼び出してください。GET_UI_STATE の応答に bridgeColorA と bridgeColorB が含まれるので、端点色を説明したい場合は活用してください。\
"""

RULES_EN = """\
- **"The color halfway between A and B" / "the middle of A and B"**: this is NOT mixing (MIX_COLORS) but the midpoint in the color space on screen, picked with the 1D Picker. Call SET_BRIDGE_COLOR(side="left", A) → SET_BRIDGE_COLOR(side="right", B) → SELECT_BRIDGE_POSITION(0.5), in that order. When the current color is one of them ("halfway between this and white"), use it for that end. Answer with the name in the tool response, e.g. "In OKLCH, the midpoint is ...".
- If the user asks to change the left or right endpoint color of the 1D Picker (Color Bridge), call SET_BRIDGE_COLOR with side="left" or side="right" and the RGB values.
- If the user asks to select a color at a specific position on the 1D Picker gradient (e.g. "middle", "center", "right-leaning"), call SELECT_BRIDGE_POSITION with position (0.0=left/A, 0.5=center, 1.0=right/B). GET_UI_STATE returns bridgeColorA and bridgeColorB so you can describe the endpoints if helpful.\
"""
