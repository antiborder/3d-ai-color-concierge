"""oklch_vs_lch トピック定義 — LCHとOKLCHの色相回転の比較。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "oklch_vs_lch",
    "s1": {
        "ja": "LCHとOKLCHで、明度と彩度を固定したまま色相だけを回すと、見え方が違います。",
        "en": "Rotate only the hue in LCH and OKLCH, keeping lightness and chroma fixed, and the results look different.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "OKLCHでは、色相を等間隔で変えても明るさが揃って見えます。",
                "LCHでは、青のあたりで色が紫寄りにずれて見えることがあります。",
            ],
            "en": [
                "In OKLCH, evenly spaced hue steps look equally bright.",
                "In LCH, blues can drift toward purple as the hue changes.",
            ],
        },
    },
}
