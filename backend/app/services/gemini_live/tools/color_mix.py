"""MIX_COLORS — 2色以上を混ぜた色をコードで計算して選択・表示するツール。

光の混色（加法混色）：各成分を足し合わせる（255 で頭打ち）。赤＋緑＝黄、3原色すべて＝白。
絵の具の混色（減法混色）：各成分を掛け合わせる（反射する光の割合の積）。シアン＋マゼンタ＝青、
3原色すべて＝黒。特に言われなければ光の混色、絵の具・色材などと言われたら絵の具の混色。
"""

from __future__ import annotations

import re

MODES = ["light", "paint"]

DECLARATIONS: list[dict] = [
    {
        "name": "MIX_COLORS",
        "description": (
            "Mix two or more colors and select the result. The app computes the mix exactly: "
            "'light' adds the colors as light (additive), 'paint' mixes them as paint or "
            "pigment (subtractive). Use it whenever the user asks what color you get by mixing colors."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "colors": {
                    "type": "array",
                    "description": "The colors to mix (2 to 4), each with its name and a typical hex code.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "The color name the user used, e.g. '紫'.",
                            },
                            "hex": {
                                "type": "string",
                                "description": "A typical #RRGGBB for that color, e.g. '#800080'.",
                            },
                        },
                        "required": ["name", "hex"],
                    },
                },
                "mode": {
                    "type": "string",
                    "enum": MODES,
                    "description": "'paint' when the user mentions paint, pigment, ink and the like; otherwise 'light'.",
                },
            },
            "required": ["colors", "mode"],
        },
    },
]

# Handled in the backend (message_receiver), not sent to the frontend as is
COMMANDS: dict[str, object] = {}

_HEX = re.compile(r"^#?([0-9a-fA-F]{6})$")


def parse_hex(value: object) -> tuple[int, int, int] | None:
    m = _HEX.match(str(value).strip())
    if not m:
        return None
    h = m.group(1)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def mix(colors: list[tuple[int, int, int]], mode: str) -> tuple[int, int, int]:
    """光の混色は成分の和（255 で頭打ち）、絵の具の混色は反射率の積。"""
    if mode == "paint":
        out = [1.0, 1.0, 1.0]
        for c in colors:
            out = [o * (v / 255) for o, v in zip(out, c)]
        return tuple(round(v * 255) for v in out)  # type: ignore[return-value]
    return tuple(min(255, sum(c[i] for c in colors)) for i in range(3))  # type: ignore[return-value]


def to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


RULES_JA = """\
## MIX_COLORS — 混色

- 「AとBを混ぜた色は？」のように、2色以上を混ぜた色を聞かれたら、必ず MIX_COLORS を呼ぶ。自分で計算しない。1Dピッカー（SET_BRIDGE_COLOR）で混色を作らない。
- mode：絵の具・塗料・インク・色材・クレヨンなどと言われたら "paint"（絵の具の混色）。それ以外、特に指定がなければ "light"（光の混色）。
- colors：ユーザーが言った色名と、その色の代表的な HEX。基本の色名には最も純粋な色を使う：赤 #FF0000、緑 #00FF00、青 #0000FF、黄色 #FFFF00、シアン #00FFFF、マゼンタ #FF00FF、白 #FFFFFF、黒 #000000、紫 #800080。暗い緑 #008000 のような、名前の一般的な表記（CSS など）は使わない。
- 結果は tool response の hex と name で答え、光の混色か絵の具の混色かを一言添える（例：「光の混色では、紫と黄色を混ぜると明るいクリーム色（#FFFF80）になります。」）。RGB値は言わない。\
"""

RULES_EN = """\
## MIX_COLORS — Mixing colors

- When the user asks what color you get by mixing two or more colors, ALWAYS call MIX_COLORS. Do not compute it yourself, and do not build a mix with the 1D picker (SET_BRIDGE_COLOR).
- mode: "paint" when the user mentions paint, pigment, ink, crayons and the like; otherwise, by default, "light".
- colors: the color names the user said, each with a typical hex. For basic color names use the purest color: red #FF0000, green #00FF00, blue #0000FF, yellow #FFFF00, cyan #00FFFF, magenta #FF00FF, white #FFFFFF, black #000000, purple #800080. Do not use conventional values such as CSS green #008000.
- Answer with the hex and name from the tool response, saying whether it is a mix of light or of paint (e.g. "Mixing purple and yellow light gives a light cream (#FFFF80)."). Do not say RGB values.\
"""
