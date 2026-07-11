"""rgb_primary トピック定義 — 光の三原色と加法混色。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "rgb_primary",
    "s1": {
        "ja": "RGBは光の三原色である赤、緑、青を組み合わせて色を表現する方式です。",
        "en": "RGB is a color model that combines red, green, and blue — the primary colors of light.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "テレビやディスプレイなどで使われており、光を重ねるほど明るくなる「加法混色」の方式です。",
                "赤・緑・青を最大にすると白、すべて0にすると黒になります。",
                "スマートフォンや液晶モニターの画面はすべてRGBの組み合わせで色を表示しています。",
            ],
            "en": [
                "It's used in TVs, monitors, and phones — more light means brighter color, called additive mixing.",
                "Max red, green, and blue gives white; all zeros give black.",
                "Every pixel on your screen is made of tiny red, green, and blue lights.",
            ],
        },
    },
    "s3": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                {"text": "人間の視覚に近づけた空間がLab空間です。見てみますか？", "leads_to": "lab_space"},
                {"text": "CMYという色材の三原色と比較してみますか？", "leads_to": "cmy_primary"},
                {"text": "この空間で色を探してみますか？", "leads_to": None},
            ],
            "en": [
                {"text": "Lab space is designed to match human perception — want to see it?", "leads_to": "lab_space"},
                {"text": "Want to compare with CMY, the primary colors of pigment?", "leads_to": "cmy_primary"},
                {"text": "Want to explore colors in this space?", "leads_to": None},
            ],
        },
    },
    "related": ["lab_space", "cmy_primary"],
}
