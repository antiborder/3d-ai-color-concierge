"""light_visible_reason トピック定義 — 光が見える理由。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "light_visible_reason",
    "s1": {
        "ja": "光が目に入って網膜の視細胞を刺激し、その信号が脳に届くことで「見える」と感じます。",
        "en": "We see when light enters the eye, stimulates cells in the retina, and their signals reach the brain.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "色を感じる視細胞は錐体といい、L・M・Sの3種類があります。",
                "目のレンズである水晶体が、光を網膜の上に集めています。",
            ],
            "en": [
                "The cells that sense color are called cones, and there are three kinds: L, M and S.",
                "The lens of the eye focuses light onto the retina.",
            ],
        },
    },
}
