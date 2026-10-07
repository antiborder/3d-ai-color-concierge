"""saturation トピック定義 — 彩度。

スライド（Saturation.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら Saturation.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "saturation",
    "s1": {
        "ja": (
            "彩度は、色の鮮やかさのことです。"
            "彩度が高いほど鮮やかで、低いほどくすんだ色になり、0%では色みのないグレーになります。"
            "HSLの色空間では、中心の軸からの距離が彩度で、ふちが一番鮮やかです。"
            "例えばオレンジの彩度を下げていくと、くすんだ茶色を経て、グレーになります。"
        ),
        "en": (
            "Saturation is how vivid a color is. "
            "The higher it is, the more vivid the color; the lower, the duller, and at 0% it becomes a gray with no hue. "
            "In the HSL color space, saturation is the distance from the central axis, and the edge is the most vivid. "
            "For example, lowering orange's saturation takes it through a dull brown to gray."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
