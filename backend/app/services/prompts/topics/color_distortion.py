"""color_distortion トピック定義 — 色の歪み。

スライド（ColorDistortion.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorDistortion.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_distortion",
    "s1": {
        "ja": (
            "色の歪みとは、色空間の数値の差と、見た目の差が一致しないことです。"
            "例えばHSLで、輝度を同じ50%にしても、黄色は明るく、青は暗く見えます。"
            "また、色相を同じ角度ずつ変えても、緑のあたりは変化が小さく、赤から黄色のあたりは大きく見えます。"
            "この歪みを小さくするために、LabやOKLCHのような、見た目に合わせた色空間が作られました。"
        ),
        "en": (
            "Color distortion is when differences in a color space's numbers don't match differences in how colors look. "
            "In HSL, for example, even at the same lightness of 50%, yellow looks light and blue looks dark. "
            "And changing the hue in equal steps, the change looks small around green but large from red to yellow. "
            "To reduce this distortion, color spaces matched to how we see, like Lab and OKLCH, were made."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
