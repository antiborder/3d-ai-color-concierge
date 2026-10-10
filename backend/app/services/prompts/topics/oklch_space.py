"""oklch_space トピック定義 — OKLCH色空間。

スライド（OklchSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら OklchSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "oklch_space",
    "s1": {
        "ja": (
            "OKLCH色空間は、OKLabを極座標で表したものです。"
            "Lは明るさ、Cは中心からの距離で鮮やかさ、Hは角度で色相を表します。"
            "LCHと同じ使い方ですが、色相を変えても、明るさや色みがより正確にそろいます。"
            "CSSでも使えるようになり、ウェブデザインで注目されています。"
            "このアプリのColor Harmonyも、OKLCHで配色を計算しています。"
        ),
        "en": (
            "The OKLCH color space is OKLab written in polar coordinates. "
            "L is lightness, C is the distance from the center, showing vividness, and H is the angle, showing hue. "
            "It is used like LCH, but lightness and tint stay more accurately even as the hue changes. "
            "It can now be used in CSS too, and is getting attention in web design. "
            "This app's Color Harmony also works out its schemes in OKLCH."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
