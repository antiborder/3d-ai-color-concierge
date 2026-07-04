"""ADJUST_VALUE — 現在色の明度・彩度・色相を調整するツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "ADJUST_VALUE",
        "description": (
            "Adjust the current color's brightness, saturation, or hue while preserving the current color. "
            "All adjustments are performed in HSL color space "
            "(brightness = lightness 'L', saturation = saturation 'S', hue = hue 'H'). "
            "HSL ranges: saturation 's' is always 0–100 (100 = fully saturated, NOT 80 or any other value), "
            "lightness 'l' is always 0–100, hue 'h' is always 0–360. "
            "IMPORTANT: Before using this tool, you should call GET_UI_STATE to get the current color state. "
            "This tool modifies the current color in place, NOT selecting a new color. "
            "Direction: 'up' means increase (brighter, more vibrant), 'down' means decrease (darker, less vibrant). "
            "For selecting a new color by name or description, use SELECT_COLOR instead."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "property": {
                    "type": "string",
                    "enum": ["brightness", "saturation", "hue"],
                },
                "direction": {
                    "type": "string",
                    "enum": ["up", "down"],
                    "description": "'up' for increase (brighter, more vibrant), 'down' for decrease (darker, less vibrant)",
                },
                "amount": {
                    "type": "number",
                    "minimum": 0,
                    "description": (
                        "Absolute adjustment amount on a 0-100 scale for brightness/saturation "
                        "(e.g., 10 means add/subtract 10 points), or 0-360 scale for hue. "
                        "When user says '10%', use 10 (absolute points), NOT a fraction of the current value. "
                        "Default is 20 if not specified."
                    ),
                },
            },
            "required": ["property", "direction"],
        },
    },
]


def _adjust_value(args: dict) -> dict:
    params: dict = {
        "property": args.get("property"),
        "direction": args.get("direction"),
    }
    if "amount" in args:
        params["amount"] = args.get("amount")
    return params


COMMANDS: dict[str, object] = {
    "ADJUST_VALUE": _adjust_value,
}

RULES_JA = """\
- **重要**: ユーザーが明度・彩度・色相を増減するよう依頼した場合（例：「もっと明るくして」「明度を上げて」「鮮やかにして」）、必ず以下の手順を実行してください：
  1. まず GET_UI_STATE を呼び出して現在の色状態を取得してください
  2. 限界値に達しているかどうかを確認してください。**HSLの範囲は常に：彩度(s) 0〜100、明度(l) 0〜100、色相(h) 0〜360です。彩度の最大値は常に100であり、80など他の値ではありません。**
     - 明度（lightness "l"）が100で「もっと明るく」と言われた場合、または0で「もっと暗く」と言われた場合、ADJUST_VALUE を呼び出さず、自然に「すでに最大の明るさになっています」または「すでに最小の明るさになっています」と伝えてください。
     - 彩度（saturation "s"）が100で「もっと鮮やかに」と言われた場合、または0で「彩度を下げて」と言われた場合、ADJUST_VALUE を呼び出さず、自然に「すでに最大の彩度になっています」または「すでに最小の彩度になっています」と伝えてください。
     - GET_UI_STATE の結果で彩度が100未満（例：s=80）だった場合は、最大値ではありません。ADJUST_VALUE を呼んでさらに上げてください。
  3. 限界値に達していない場合のみ、ADJUST_VALUE を呼び、続けて CHANGE_SHAPE("HSL") を呼んでください。正しい方向を指定してください：
     - 「もっと明るく」「明度を上げて」「明るくして」→ direction="up"
     - 「もっと暗く」「明度を下げて」「暗くして」→ direction="down"
     - 「もっと鮮やかに」「彩度を上げて」「鮮やかにして」→ direction="up" for saturation
     - 「くすませて」「彩度を下げて」「くすんだ色に」→ direction="down" for saturation
     - **重要 - amount の解釈**: `amount` パラメータは 0-100 スケールの**絶対値**です。
       - 「明度を10%上げて」「10上げて」→ amount=10（現在値 × 0.10 ではない）
       - 「20%上げて」→ amount=20
       - 絶対に現在値の割合として計算しないでください。ユーザーが言った数値をそのまま絶対値として渡してください。
  4. 明度・彩度・色相の調整には絶対に SELECT_COLOR を使用しないでください。SELECT_COLOR は色名や説明で新しい色を選ぶ場合のみ使用してください。\
"""

RULES_EN = """\
- **CRITICAL**: When the user asks to increase/decrease brightness, saturation, or hue (e.g., "make it brighter", "increase brightness", "make it more vibrant"), you MUST:
  1. First call GET_UI_STATE to get the current color state
  2. Check if the value is already at the limit. **HSL ranges are always: saturation 0–100, lightness 0–100, hue 0–360. The saturation maximum is ALWAYS 100, never 80 or any other value.**
     - If brightness (lightness "l") is 100 and user asks to increase brightness, or if it's 0 and user asks to decrease brightness, DO NOT call ADJUST_VALUE. Instead, respond naturally: "It's already at maximum brightness" or "It's already at minimum brightness".
     - If saturation ("s") is 100 and user asks to increase saturation, or if it's 0 and user asks to decrease saturation, DO NOT call ADJUST_VALUE. Instead, respond naturally: "It's already at maximum saturation" or "It's already at minimum saturation".
     - If the GET_UI_STATE result shows saturation below 100 (e.g., s=80), it is NOT at maximum — call ADJUST_VALUE to increase it further.
  3. If not at the limit, call ADJUST_VALUE followed immediately by CHANGE_SHAPE("HSL"), with the correct direction:
     - "brighter", "increase brightness", "make it lighter" → direction="up"
     - "darker", "decrease brightness", "make it darker" → direction="down"
     - "more vibrant", "increase saturation", "more saturated" → direction="up" for saturation
     - "less vibrant", "decrease saturation", "less saturated" → direction="down" for saturation
     - **CRITICAL - amount interpretation**: The `amount` parameter is an ABSOLUTE value on a 0-100 scale for brightness/saturation.
       - If user says "increase brightness by 10%" or "increase by 10", set amount=10 (NOT current_value × 0.10).
       - If user says "increase by 20%", set amount=20.
       - NEVER compute amount as a fraction of the current value. Always use the percentage number directly as absolute points.
  4. NEVER use SELECT_COLOR for brightness/saturation/hue adjustments. SELECT_COLOR is ONLY for selecting a new color by name or description.\
"""
