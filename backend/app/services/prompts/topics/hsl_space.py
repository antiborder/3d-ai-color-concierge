"""hsl_space トピック定義 — HSL色空間。

スライド（HslSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HslSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hsl_space",
    "s1": {
        "ja": (
            "HSL色空間は、色を色相・彩度・輝度の3つで表す、上下に尖った双円錐です。"
            "色相は円周上の角度で、赤を0度として、黄色、緑、シアン、青、マゼンタと一周します。"
            "彩度は中心からの距離で、中心の軸はグレーになります。"
            "輝度は高さで、上の先端は白、下の先端は黒です。"
            "真ん中の高さで、最も鮮やかな色になります。"
            "例えばオレンジは、色相30度、彩度100%、輝度50%です。"
        ),
        "en": (
            "HSL color space describes a color by its hue, saturation and lightness, "
            "and is shaped like a double cone, pointed at the top and bottom. "
            "Hue is an angle around the circle: starting from red at 0 degrees, it goes around "
            "through yellow, green, cyan, blue and magenta. "
            "Saturation is the distance from the center, and the central axis is gray. "
            "Lightness is the height: the top tip is white and the bottom tip is black. "
            "Colors are most vivid at the middle height. "
            "Orange, for example, is hue 30 degrees, saturation 100%, lightness 50%."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
