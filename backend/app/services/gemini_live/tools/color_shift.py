"""SHIFT_TOWARD_COLOR — 選択色または背景色を、指定の色へ少し近づけるツール。

「もっと紫っぽく」「オリーブ色に近づけて」「暖かくして」「パステルっぽく」のような依頼に使う。色相の向き（上げるか
下げるか）をAIに推測させず、今の色と目標の色を OKLab（見た目の差がそろった色空間）で結んだ線の
途中の色を、コードで計算する。
"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "SHIFT_TOWARD_COLOR",
        "description": (
            "Move the selected color or the background part of the way toward another color, "
            "e.g. 'more purplish', 'closer to olive', 'a bit greener', 'warmer'. The app computes "
            "the new color in OKLab, so it keeps most of the current color."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "hex": {
                    "type": "string",
                    "description": "A typical #RRGGBB of the color to move toward, e.g. '#800080' for purple.",
                },
                "name": {
                    "type": "string",
                    "description": "The color name the user used, e.g. '紫'.",
                },
                "amount": {
                    "type": "number",
                    "minimum": 0.05,
                    "maximum": 1,
                    "description": "How far to move: 0.2 for 'a little', 0.35 by default, 0.6 for 'a lot'.",
                },
                "target": {
                    "type": "string",
                    "enum": ["focused", "background"],
                    "description": "'background' when the user talks about the background; otherwise 'focused'.",
                },
            },
            "required": ["hex", "target"],
        },
    },
]

# Handled in the backend (message_receiver), not sent to the frontend as is
COMMANDS: dict[str, object] = {}

DEFAULT_AMOUNT = 0.35


def _to_linear(c: float) -> float:
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _to_srgb(c: float) -> int:
    c = max(0.0, min(1.0, c))
    c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return round(c * 255)


def rgb_to_oklab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    r, g, b = (_to_linear(c) for c in rgb)
    l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def oklab_to_rgb(lab: tuple[float, float, float]) -> tuple[int, int, int]:
    L, a, b = lab
    l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (
        _to_srgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
        _to_srgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
        _to_srgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_),
    )


def shift_toward(
    current: tuple[int, int, int], goal: tuple[int, int, int], amount: float
) -> tuple[int, int, int]:
    """current から goal へ、OKLab の直線上を amount（0〜1）の割合だけ進んだ色。"""
    t = max(0.0, min(1.0, amount))
    a, b = rgb_to_oklab(current), rgb_to_oklab(goal)
    return oklab_to_rgb(tuple(x + (y - x) * t for x, y in zip(a, b)))  # type: ignore[arg-type]


RULES_JA = """\
## SHIFT_TOWARD_COLOR — 色を別の色に近づける

- 「もっと紫っぽく」「オリーブ色に近づけて」「少し緑寄りに」「黄色みを足して」のように、今の色を別の色の方へ寄せる依頼には、必ず SHIFT_TOWARD_COLOR を呼ぶ。ADJUST_VALUE の色相（hue）や SELECT_COLOR で代用しない（目標の色そのものに置き換えない）。
- 「暖かく」→ オレンジ #FF8C00 へ、「冷たく・涼しく」→ 青 #1E90FF へ、「パステルっぽく・淡く・白っぽく」→ 白 #FFFFFF へ（amount 0.5）寄せる。「くすませて」「鮮やかに」は ADJUST_VALUE の彩度。
- amount：「少し・ちょっと」0.2、指定なし 0.35、「かなり・もっとずっと」0.6。「もっと」と繰り返されたら同じ目標の色でもう一度呼ぶ。
- 背景の話なら target="background"、それ以外は "focused"。
- 結果は tool response の name で「〇〇寄りの△△になりました」と一言で伝える。RGB値は言わない。\
"""

RULES_EN = """\
## SHIFT_TOWARD_COLOR — Moving a color toward another

- For requests to move the current color toward another color ("more purplish", "closer to olive", "a bit greener", "add some yellow"), ALWAYS call SHIFT_TOWARD_COLOR. Do not use ADJUST_VALUE's hue or SELECT_COLOR instead (do not replace it with the goal color).
- "warmer" → toward orange #FF8C00; "cooler" → toward blue #1E90FF; "pastel", "paler", "whitish" → toward white #FFFFFF (amount 0.5). "duller" / "more vivid" is ADJUST_VALUE saturation.
- amount: "a little" 0.2, unspecified 0.35, "a lot" 0.6. If the user says "more" again, call it again with the same goal color.
- target="background" when the user talks about the background; otherwise "focused".
- Report the result in one short sentence using the name in the tool response. Do not say RGB values.\
"""
