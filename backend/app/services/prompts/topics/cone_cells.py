"""cone_cells トピック定義 — 錐体とは。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "cone_cells",
    "s1": {
        "ja": "錐体は網膜にある色を感じる視細胞で、L・M・Sの3種類があります。",
        "en": "Cones are the color-sensing cells in the retina, and there are three kinds: L, M and S.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "Lは長い波長、Mは中くらいの波長、Sは短い波長の光に強く反応します。",
                "3種類の錐体がどれくらいずつ反応したかの割合から、脳が色を判断しています。",
                "錐体は網膜の中心付近に多く集まっています。",
            ],
            "en": [
                "L responds most to long wavelengths, M to medium ones and S to short ones.",
                "The brain judges color from the ratio of how strongly the three cone types respond.",
                "Cones are concentrated near the center of the retina.",
            ],
        },
    },
}
