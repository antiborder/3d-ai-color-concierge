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
- **重要**: 明度・彩度・色相の増減依頼（例：「明るくして」「彩度を上げて」）には必ず以下の手順で対応する：
  1. GET_UI_STATE で現在の色状態を取得する。
  2. 限界チェック（**OkLCH範囲：L 0〜1、C 0〜0.4程度（色相で変動）、H 0〜360**）：
     - L≥1で「明るく」、L≤0で「暗く」と言われたら ADJUST_VALUE を呼ばず「すでに最大/最小の明るさです」と伝える。
     - C=0で「彩度を下げて」と言われたら ADJUST_VALUE を呼ばず「すでに無彩色です」と伝える。上げる場合は上限チェック不要で ADJUST_VALUE を呼ぶ（ガモット内に自動クランプされる）。
  3. 限界外でなければ ADJUST_VALUE を呼び、続けて CHANGE_SHAPE("OKLCH") を呼ぶ。方向指定：
     - 「明るく/明度を上げて」→ direction="up"、「暗く/明度を下げて」→ "down"
     - 「鮮やかに/彩度を上げて」→ saturationをup、「くすませて/彩度を下げて」→ saturationをdown
     - **amountは0-100スケールの絶対値**：明度(L)は amount×0.01、彩度(C)は amount×0.004、色相(H)は amount×1度。「10%上げて」「10上げて」→ amount=10（現在値の割合としては絶対に計算しない）。
  4. 明度・彩度・色相の調整に SELECT_COLOR は絶対に使わない（SELECT_COLOR は色名・説明での新規選択専用）。\
"""

RULES_EN = """\
- **CRITICAL**: When the user asks to increase/decrease brightness, saturation, or hue, you MUST:
  1. Call GET_UI_STATE to get the current color state.
  2. Check the limit (**OkLCH ranges: L 0–1, C (Chroma) 0–~0.4 (varies by hue), H 0–360**):
     - L≥1 + "brighter", or L≤0 + "darker" → do NOT call ADJUST_VALUE; say "It's already at maximum/minimum brightness".
     - C=0 + "decrease saturation" → do NOT call ADJUST_VALUE; say "It's already achromatic". For increasing saturation, always call ADJUST_VALUE regardless of C (gamut-clamped automatically).
  3. If not at the limit, call ADJUST_VALUE then immediately CHANGE_SHAPE("OKLCH"), with the correct direction:
     - "brighter"/"increase brightness" → direction="up"; "darker"/"decrease brightness" → "down"
     - "more vibrant"/"increase saturation" → saturation up; "less vibrant"/"decrease saturation" → saturation down
     - **CRITICAL - amount is a 0-100 scale**: L = amount×0.01, C = amount×0.004, H = amount×1 degree. "increase by 10%"/"increase by 10" → amount=10. NEVER compute it as a fraction of the current value.
  4. NEVER use SELECT_COLOR for brightness/saturation/hue adjustments — it is ONLY for selecting a new color by name or description.\
"""
