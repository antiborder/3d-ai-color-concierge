"""lab_space トピック定義 — Lab色空間。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "lab_space",
    "s1": {
        "ja": "Lab色空間は人間の視覚に近い形で色を数値化した方式です。",
        "en": "The Lab color space is designed to match how human vision actually perceives color.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "L*は明度（0=黒、100=白）、a*は緑↔赤、b*は青↔黄の軸を表します。",
                "知覚的に均等な色空間で、数値の差が実際の見た目の差に対応します。",
                "印刷・デザインの現場で色の正確な管理に使われます。",
            ],
            "en": [
                "L* is lightness (0=black, 100=white), a* runs green↔red, b* runs blue↔yellow.",
                "It's a perceptually uniform space — equal numerical differences feel equal to the eye.",
                "Widely used in print and design for accurate color management.",
            ],
        },
    },
    "s3": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                {"text": "RGBと並べて見比べてみますか？", "leads_to": "rgb_primary"},
                {"text": "HSL空間も見てみますか？", "leads_to": "hsl_space"},
                {"text": "他の色空間も見てみますか？", "leads_to": None},
            ],
            "en": [
                {"text": "Want to compare it side by side with RGB?", "leads_to": "rgb_primary"},
                {"text": "Want to see the HSL space too?", "leads_to": "hsl_space"},
                {"text": "Want to explore other color spaces?", "leads_to": None},
            ],
        },
    },
    "related": ["rgb_primary", "hsl_space"],
}
