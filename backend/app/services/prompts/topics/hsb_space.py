"""hsb_space トピック定義 — HSB色空間。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hsb_space",
    "s1": {
        "ja": "HSBは色相・彩度・明度の3軸で色を表現します。",
        "en": "HSB represents colors along three axes: hue, saturation, and brightness.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "Hは色相（カラーホイール上の位置）、Sは彩度（鮮やかさ）、Bは明度（明るさ）を表します。",
                "円錐の形をしており、外側が鮮やかで中心に近づくほどグレーになります。",
                "カラーホイールで直感的に色を選べるのが特徴で、グラフィックソフトでよく使われます。",
            ],
            "en": [
                "H is hue (position on the color wheel), S is saturation (vividness), B is brightness.",
                "The shape is cylindrical — the outer edge is vivid, and colors fade to gray toward the center.",
                "The color wheel makes it intuitive to pick colors — widely used in design apps.",
            ],
        },
    },
    "s3": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                {"text": "よく似たHSL空間と比べてみますか？", "leads_to": "hsl_space"},
                {"text": "RGBの形状も確認してみますか？", "leads_to": "rgb_primary"},
                {"text": "他の色空間も見てみますか？", "leads_to": None},
            ],
            "en": [
                {"text": "Want to compare with HSL, which looks similar but has key differences?", "leads_to": "hsl_space"},
                {"text": "Want to see the RGB space too?", "leads_to": "rgb_primary"},
                {"text": "Want to explore other color spaces?", "leads_to": None},
            ],
        },
    },
    "related": ["hsl_space", "rgb_primary"],
}
