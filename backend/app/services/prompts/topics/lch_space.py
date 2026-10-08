"""lch_space トピック定義 — LCH色空間。

スライド（LchSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら LchSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "lch_space",
    "s1": {
        "ja": (
            "LCH色空間は、Lab色空間を、極座標で表したものです。"
            "Lは明るさで、Labと同じです。"
            "Cは中心からの距離で、色の鮮やかさを表します。"
            "Hは中心の周りの角度で、色相を表します。"
            "HSLと似た使い方ができますが、Lが同じなら、色相が違っても明るさがそろって見えます。"
            "そのため、デザインで色をそろえるのに便利です。"
        ),
        "en": (
            "The LCH color space is the Lab color space written in polar coordinates. "
            "L is lightness, the same as in Lab. "
            "C is the distance from the center, showing how vivid a color is. "
            "H is the angle around the center, showing the hue. "
            "It can be used much like HSL, but with the same L, colors look equally light even when their hues differ. "
            "That makes it handy for keeping colors consistent in design."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
