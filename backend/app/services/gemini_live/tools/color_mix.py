"""MIX_COLORS — 2色以上を混ぜた色をコードで計算して選択・表示するツール。

光の混色（light）：各成分を足し合わせる（255 で頭打ち）。赤＋緑＝黄、3原色すべて＝白。
色材の混色（pigment）：色材の三原色のルール。各成分を掛け合わせる（反射する光の割合の積）。
  シアン＋マゼンタ＝青、3原色すべて＝黒。色材・インク・色材の三原色と言われたとき。
絵の具の混色（paint）：実際の絵の具に近い混色（paint_mix.py、反射の分布と Kubelka-Munk 理論）。
  青＋黄色＝緑、赤＋白＝明るい赤。絵の具・塗料・クレヨンなどと言われたとき。
特に言われなければ光の混色。
"""

from __future__ import annotations

import re

from app.services.gemini_live.tools.paint_mix import mix_paint

MODES = ["light", "pigment", "paint"]

DECLARATIONS: list[dict] = [
    {
        "name": "MIX_COLORS",
        "description": (
            "Mix two or more colors and select the result. The app computes the mix exactly: "
            "'light' adds the colors as light (additive), 'pigment' follows the rule of the pigment "
            "primaries (subtractive, ideal inks), 'paint' mixes them like real paint. "
            "Use it whenever the user asks what color you get by mixing colors."
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
                    "description": (
                        "'paint' when the user mentions paint (絵の具), crayons and the like; "
                        "'pigment' when they mention colorants (色材), ink or the pigment primaries; "
                        "otherwise 'light'."
                    ),
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
    """光の混色は成分の和（255 で頭打ち）、色材の混色は反射率の積、絵の具の混色は paint_mix。"""
    if mode == "paint":
        return mix_paint(colors)
    if mode == "pigment":
        out = [1.0, 1.0, 1.0]
        for c in colors:
            out = [o * (v / 255) for o, v in zip(out, c)]
        return tuple(round(v * 255) for v in out)  # type: ignore[return-value]
    return tuple(min(255, sum(c[i] for c in colors)) for i in range(3))  # type: ignore[return-value]


def to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


RULES_JA = """\
## MIX_COLORS — 混色

- 「AとBを混ぜた色は？」のように、2色以上を混ぜた色を聞かれたら、必ず MIX_COLORS を呼ぶ。「中間の色」「真ん中の色」は混色ではない（1D Picker の中点、color_bridge のルール）。自分で計算しない。1Dピッカー（SET_BRIDGE_COLOR）で混色を作らない。
- mode：ユーザーが言った言葉で決める。推測しない。
  - 「絵の具」「塗料」「クレヨン」など → "paint"（実際の絵の具に近い混色。青＋黄色＝緑、赤＋白＝明るい赤）
  - 「色材」「インク」「色材の三原色」など → "pigment"（色材の三原色のルール。シアン＋マゼンタ＝青、3色で黒）
  - どちらも言っていなければ必ず "light"（光の混色）
- colors：ユーザーが言った色名と、その色の代表的な HEX。基本の色名には最も純粋な色を使う：赤 #FF0000、緑 #00FF00、青 #0000FF、黄色 #FFFF00、シアン #00FFFF、マゼンタ #FF00FF、白 #FFFFFF、黒 #000000、紫 #800080。暗い緑 #008000 のような、名前の一般的な表記（CSS など）は使わない。
- 結果は tool response の hex と name で答え、光の混色・色材の混色・絵の具の混色のどれかを一言添える（例：「光の混色では、紫と黄色を混ぜると明るいクリーム色（#FFFF80）になります。」）。RGB値は言わない。\
"""

RULES_EN = """\
## MIX_COLORS — Mixing colors

- When the user asks what color you get by mixing two or more colors, ALWAYS call MIX_COLORS. "The color halfway between" / "the middle color" is not mixing (it is the 1D Picker's midpoint; see its rules). Do not compute it yourself, and do not build a mix with the 1D picker (SET_BRIDGE_COLOR).
- mode: decide by the user's words; never guess.
  - "paint", "crayons" and the like → "paint" (like real paint: blue + yellow = green, red + white = light red)
  - "pigment", "ink", "the pigment primaries" and the like → "pigment" (the rule of the pigment primaries: cyan + magenta = blue, all three = black)
  - neither → ALWAYS "light"
- colors: the color names the user said, each with a typical hex. For basic color names use the purest color: red #FF0000, green #00FF00, blue #0000FF, yellow #FFFF00, cyan #00FFFF, magenta #FF00FF, white #FFFFFF, black #000000, purple #800080. Do not use conventional values such as CSS green #008000.
- Answer with the hex and name from the tool response, saying whether it is a mix of light, of pigment or of paint (e.g. "Mixing purple and yellow light gives a light cream (#FFFF80)."). Do not say RGB values.\
"""
