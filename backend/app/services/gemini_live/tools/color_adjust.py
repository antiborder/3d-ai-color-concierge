"""ADJUST_VALUE — 現在色の明度・彩度・色相を調整するツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "ADJUST_VALUE",
        "description": (
            "Adjust the current color's brightness, saturation, or hue while preserving the current color. "
            "All adjustments are performed in OkLCH color space "
            "(brightness = perceptual lightness 'L', saturation = chroma 'C', hue = hue angle 'H'). "
            "OkLCH ranges: L is 0–1, C is 0–~0.4 (maximum varies by hue), H is 0–360. "
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
                        "Absolute adjustment amount on a 0-100 scale. "
                        "For brightness (L): amount=10 means +0.10 on the 0-1 L scale. "
                        "For saturation (C): amount=10 means +0.04 on the 0-0.4 C scale. "
                        "For hue (H): amount=10 means +10 degrees (0-360 scale). "
                        "When user says '10%', use 10. Default is 20 if not specified."
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
  2. 限界値に達しているかどうかを確認してください。**OkLCHの範囲は：輝度(L) 0〜1、彩度(C/Chroma) 0〜0.4程度（色相によって異なる）、色相(H) 0〜360です。**
     - OkLCH輝度（L）が1以上で「もっと明るく」と言われた場合、または0以下で「もっと暗く」と言われた場合、ADJUST_VALUE を呼び出さず、自然に「すでに最大の明るさになっています」または「すでに最小の明るさになっています」と伝えてください。
     - Chroma（C）が0で「彩度を下げて」と言われた場合、ADJUST_VALUE を呼び出さず、「すでに無彩色です」と伝えてください。彩度の上限はLとHによって異なるため、上限チェックは行わず ADJUST_VALUE を呼んでください（ガモット内に自動でクランプされます）。
  3. 限界値に達していない場合のみ、ADJUST_VALUE を呼び、続けて CHANGE_SHAPE("OKLCH") を呼んでください。正しい方向を指定してください：
     - 「もっと明るく」「明度を上げて」「明るくして」→ direction="up"
     - 「もっと暗く」「明度を下げて」「暗くして」→ direction="down"
     - 「もっと鮮やかに」「彩度を上げて」「鮮やかにして」→ direction="up" for saturation
     - 「くすませて」「彩度を下げて」「くすんだ色に」→ direction="down" for saturation
     - **重要 - amount の解釈**: `amount` パラメータは0-100スケールの絶対値です。
       - 明度（L）: amount=10 → Lに+0.10（0-1スケール）
       - 彩度（C）: amount=10 → Cに+0.04（0-0.4スケール）
       - 色相（H）: amount=10 → Hに+10度（0-360スケール）
       - 「明度を10%上げて」「10上げて」→ amount=10。絶対に現在値の割合として計算しないでください。
  4. 明度・彩度・色相の調整には絶対に SELECT_COLOR を使用しないでください。SELECT_COLOR は色名や説明で新しい色を選ぶ場合のみ使用してください。\
"""

RULES_EN = """\
- **CRITICAL**: When the user asks to increase/decrease brightness, saturation, or hue (e.g., "make it brighter", "increase brightness", "make it more vibrant"), you MUST:
  1. First call GET_UI_STATE to get the current color state
  2. Check if the value is already at the limit. **OkLCH ranges: L is 0–1, C (Chroma) is 0–~0.4 (varies by hue), H is 0–360.**
     - If OkLCH lightness (L) is ≥ 1 and user asks to increase brightness, or if it's ≤ 0 and user asks to decrease brightness, DO NOT call ADJUST_VALUE. Instead, respond naturally: "It's already at maximum brightness" or "It's already at minimum brightness".
     - If Chroma (C) is 0 and user asks to decrease saturation, DO NOT call ADJUST_VALUE. Respond: "It's already achromatic (no saturation)". For increasing saturation, always call ADJUST_VALUE regardless of current C — the result will be gamut-clamped automatically.
  3. If not at the limit, call ADJUST_VALUE followed immediately by CHANGE_SHAPE("OKLCH"), with the correct direction:
     - "brighter", "increase brightness", "make it lighter" → direction="up"
     - "darker", "decrease brightness", "make it darker" → direction="down"
     - "more vibrant", "increase saturation", "more saturated" → direction="up" for saturation
     - "less vibrant", "decrease saturation", "less saturated" → direction="down" for saturation
     - **CRITICAL - amount interpretation**: The `amount` parameter is on a 0-100 scale.
       - Brightness (L): amount=10 adds/subtracts 0.10 on the 0-1 L scale.
       - Saturation (C): amount=10 adds/subtracts 0.04 on the 0-0.4 C scale.
       - Hue (H): amount=10 adds/subtracts 10 degrees directly.
       - If user says "increase brightness by 10%" or "increase by 10", set amount=10.
       - NEVER compute amount as a fraction of the current value.
  4. NEVER use SELECT_COLOR for brightness/saturation/hue adjustments. SELECT_COLOR is ONLY for selecting a new color by name or description.\
"""
