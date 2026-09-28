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
}
