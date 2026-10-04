"""hsb_space トピック定義 — HSB色空間。

スライド（HsbSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HsbSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hsb_space",
    "s1": {
        "ja": (
            "HSB色空間は、色を色相・彩度・明度の3つで表す、逆さの円錐です。"
            "色相は、色の種類を円周上の角度で表します。"
            "赤を0度として、黄色、緑、シアン、青、マゼンタと一周します。"
            "彩度は中心からの距離で、中心ほど薄く、外側ほど鮮やかになります。"
            "明度は高さで、下にいくほど暗くなり、先端は黒です。"
            "例えばオレンジは、色相30度、彩度100%、明度100%です。"
        ),
        "en": (
            "HSB color space describes a color by its hue, saturation and brightness, "
            "and is shaped like an upside-down cone. "
            "Hue is the kind of color, given as an angle around the circle. "
            "Starting from red at 0 degrees, it goes around through yellow, green, cyan, blue "
            "and magenta. "
            "Saturation is the distance from the center: paler toward the center, "
            "more vivid toward the edge. "
            "Brightness is the height: the lower, the darker, and the tip is black. "
            "Orange, for example, is hue 30 degrees, saturation 100%, brightness 100%."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
