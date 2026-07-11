"""hsl_space トピック定義 — HSL色空間。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hsl_space",
    "s1": {
        "ja": "HSLは色相・彩度・輝度の3軸で色を表現します。",
        "en": "HSL represents colors along three axes: hue, saturation, and lightness.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ → そのまま文3へ
        "options": {
            "ja": [
                "Hは色相、Sは彩度、Lは輝度を表し、一番上が白、一番下が黒となるのが特徴です。",
                "HSL空間は双円錐形（上下に尖った形）として表現されます。",
                "HSL座標はRGB座標を元にして計算されます。Webデザインなどでよく使われます。",
                "輝度0.5のときに最も鮮やかな色になり、0に近づくほど黒、1に近づくほど白になります。",
            ],
            "en": [
                "H is hue, S is saturation, L is lightness — the top is white and the bottom is black.",
                "The HSL space is shaped like a double cone — pointed at both top and bottom.",
                "HSL values are calculated from RGB and are commonly used in web design (CSS).",
                "At lightness 0.5 colors are most vivid; approaching 0 gives black, approaching 1 gives white.",
            ],
        },
    },
    "s3": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                {"text": "HSB空間と似ているようで大きな違いがあります。HSB空間も見てみますか？", "leads_to": "hsb_space"},
                {"text": "RGBの形状も見てみますか？", "leads_to": "rgb_primary"},
                {"text": "同じく極座標を用いた方法として、LCHがあります。見てみますか？", "leads_to": None},
                {"text": "他の色空間も見てみますか？", "leads_to": None},
            ],
            "en": [
                {"text": "HSB looks similar but has key differences — want to compare?", "leads_to": "hsb_space"},
                {"text": "Want to see the RGB space too?", "leads_to": "rgb_primary"},
                {"text": "LCH is another cylindrical color space — want to hear about it?", "leads_to": None},
                {"text": "Want to explore other color spaces?", "leads_to": None},
            ],
        },
    },
    "related": ["hsb_space", "rgb_primary"],
}
