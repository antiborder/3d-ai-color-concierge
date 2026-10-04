"""hsb_vs_hsl トピック定義 — HSBとHSLの違い。

スライド（HsbVsHsl.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HsbVsHsl.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hsb_vs_hsl",
    "s1": {
        "ja": (
            "HSBとHSLは、明るさの決め方が違います。"
            "1つの色相で縦に切ると、HSBは逆三角形、HSLは上下に尖った形です。"
            "鮮やかな赤は、HSBでは一番上の明度100%、HSLでは真ん中の輝度50%です。"
            "白は、HSBでは上の辺の中心、HSLでは一番上の頂点です。"
            "彩度と明るさが100%のとき、HSBは鮮やかな色、HSLは白になります。"
        ),
        "en": (
            "HSB and HSL differ in how they define brightness. "
            "Cut through one hue, and HSB is an upside-down triangle, "
            "while HSL is pointed at the top and bottom. "
            "Vivid red sits at the very top in HSB, at brightness 100%, "
            "but in the middle in HSL, at lightness 50%. "
            "White is the middle of the top edge in HSB, and the top tip in HSL. "
            "So with saturation and brightness at 100%, HSB gives a vivid color, "
            "while HSL gives white."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
