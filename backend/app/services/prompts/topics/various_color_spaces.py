"""various_color_spaces トピック定義 — 様々な色空間。

スライド（VariousColorSpaces.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら VariousColorSpaces.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "various_color_spaces",
    "s1": {
        "ja": (
            "色空間は、色を数値で表すための座標の決め方で、目的に合わせてたくさんの種類があります。"
            "画面のためのRGB、印刷のためのCMYK、色を直感的に選ぶためのHSBやHSL、"
            "基準となるXYZやLMS、そして見た目の差をそろえたLabやOKLabなどです。"
            "同じオレンジでも、色空間ごとに数値の表し方が変わります。"
            "このアプリでは、これらの色空間の形を切り替えて見比べられます。"
        ),
        "en": (
            "A color space is a way of choosing coordinates to describe colors as numbers, "
            "and there are many kinds, each made for a purpose. "
            "There's RGB for screens, CMYK for print, HSB and HSL for picking colors intuitively, "
            "XYZ and LMS as references, and Lab and OKLab, which even out differences in how colors look. "
            "Even the same orange is written with different numbers in each color space. "
            "In this app, you can switch between the shapes of these color spaces and compare them."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
