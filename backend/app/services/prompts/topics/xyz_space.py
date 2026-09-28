"""xyz_space トピック定義 — CIE XYZ色空間。"""

from __future__ import annotations

TOPIC: dict = {
    "id": "xyz_space",
    "s1": {
        "ja": "XYZは、人間の目の3種類の錐体細胞の反応をもとに作られた標準の色空間です。",
        "en": "XYZ is a standard color space built on how the eye's three types of cone cells respond.",
    },
    "s2": {
        "skip_probability": 0.5,  # 5割でスキップ
        "options": {
            "ja": [
                "人が知覚できるすべての色を含んでいて、画面では表示できない色も表せます。",
                "1931年にCIEが定めたもので、多くの色空間がXYZを基準に定義されています。",
                "Yの軸は、人が感じる明るさ（輝度）を表しています。",
            ],
            "en": [
                "It contains every color humans can perceive, including colors screens can't display.",
                "Defined by the CIE in 1931, it's the reference many other color spaces are built on.",
                "The Y axis represents luminance — how bright a color looks to us.",
            ],
        },
    },
}
