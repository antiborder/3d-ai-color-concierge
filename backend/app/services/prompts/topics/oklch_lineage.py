"""oklch_lineage トピック定義 — 色科学の系統図。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "oklch_lineage",
    "s1": {
        "ja": "色空間は、XYZを出発点に2つの流れに分かれて発展してきました。",
        "en": "Color spaces grew from XYZ along two main branches.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "ひとつはLabとLCH、もうひとつはLMSを経由したOKLabとOKLCHです。",
                "LCHとOKLCHは、それぞれLabとOKLabを極座標で表したものです。",
                "OKLabは、Labの青のあたりのずれを改良した、新しい色空間です。",
            ],
            "en": [
                "One branch is Lab and LCH; the other goes through LMS to OKLab and OKLCH.",
                "LCH and OKLCH are Lab and OKLab expressed in polar coordinates.",
                "OKLab is a newer color space that fixes Lab's drift around blue.",
            ],
        },
    },
}
