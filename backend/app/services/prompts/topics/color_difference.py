"""color_difference トピック定義 — 色差。

スライド（ColorDifference.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorDifference.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_difference",
    "s1": {
        "ja": (
            "色差は、2つの色の違いを数値で表したもので、ΔEと書きます。"
            "LabやOKLabの空間での、2点の距離として計算します。"
            "ΔEがおよそ1なら、並べてもほとんど区別できず、数が大きくなるほど、はっきり違う色に見えます。"
            "印刷物や製品の色が、指定どおりに作れているかを確かめるのに使われます。"
        ),
        "en": (
            "Color difference expresses how different two colors are as a number, written ΔE. "
            "It is calculated as the distance between two points in a space like Lab or OKLab. "
            "At a ΔE of about 1, two colors side by side are hard to tell apart, and the bigger the number, the more clearly different they look. "
            "It is used to check that printed matter and products come out in the specified color."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
