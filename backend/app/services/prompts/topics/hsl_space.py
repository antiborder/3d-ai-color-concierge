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
}
