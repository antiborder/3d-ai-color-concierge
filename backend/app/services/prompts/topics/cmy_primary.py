"""cmy_primary トピック定義 — 色材の三原色と減法混色。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "cmy_primary",
    "s1": {
        "ja": "CMYは色材の三原色であるシアン・マゼンタ・イエローを組み合わせて色を表現する方式です。",
        "en": "CMY is a color model combining cyan, magenta, and yellow — the primary colors of pigment.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "絵の具やインクなどで使われており、色を重ねるほど暗くなる「減法混色」の方式です。",
                "CMYKと呼ばれる場合はK（黒）を加えた4色で表現し、印刷でよく使われます。",
                "シアン・マゼンタ・イエローをすべて最大にすると黒に近づき、すべて0にすると白になります。",
            ],
            "en": [
                "It's used in paints and inks — mixing more pigment makes the color darker, called subtractive mixing.",
                "CMYK adds black (K) as a fourth channel, commonly used in printing.",
                "Max cyan, magenta, and yellow approaches black; all zeros gives white.",
            ],
        },
    },
    "s3": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                {"text": "光の三原色RGBと並べて比較してみますか？", "leads_to": "rgb_primary"},
                {"text": "他の色空間も見てみますか？", "leads_to": None},
            ],
            "en": [
                {"text": "Want to compare with RGB, the primary colors of light?", "leads_to": "rgb_primary"},
                {"text": "Want to explore other color spaces?", "leads_to": None},
            ],
        },
    },
    "related": ["rgb_primary"],
}
