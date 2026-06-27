"""CHANGE_SHAPE — 色空間 / UIシェイプ切り替えツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "CHANGE_SHAPE",
        "description": "Switch color space / UI shape. Available: RGB, CMYK, HSL, HSV, Lab (CIE Lab), LCH.",
        "parameters": {
            "type": "object",
            "properties": {
                "colorSpace": {
                    "type": "string",
                    "enum": ["RGB", "CMYK", "HSL", "HSV", "Lab", "LCH"],
                }
            },
            "required": ["colorSpace"],
        },
    },
]


def _change_shape(args: dict) -> dict:
    return {"colorSpace": args.get("colorSpace")}


COMMANDS: dict[str, object] = {
    "CHANGE_SHAPE": _change_shape,
}

RULES_JA = """\
- ユーザーの発話がUI操作（色変更/明度・彩度・色相調整/色空間変更）に該当する場合は、必ず tool call を使ってください。\
"""

RULES_EN = """\
- If the user asks to change color / adjust brightness/saturation/hue / change color space, you MUST use a tool call.\
"""
