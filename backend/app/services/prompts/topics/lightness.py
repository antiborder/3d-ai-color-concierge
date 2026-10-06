"""lightness トピック定義 — 輝度（HSL の L）。

スライド（Lightness.tsx → LightLevelSlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら LightLevelSlide.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "lightness",
    "s1": {
        "ja": (
            "輝度は、HSLのLにあたる明るさの値です。"
            "RGBの一番大きい値と一番小さい値を足して、2で割って決まります。"
            "例えばオレンジは、255と0の平均で、輝度は50%です。"
            "鮮やかな色は50%、白になると100%です。"
            "ただし、黄色と青はどちらも輝度50%ですが、見た目の明るさはかなり違います。"
        ),
        "en": (
            "Lightness is the value that is HSL's L. "
            "It is the largest and the smallest RGB values added together and divided by 2. "
            "Orange, for example, averages 255 and 0, so its lightness is 50%. "
            "Vivid colors are at 50%, and white is at 100%. "
            "But yellow and blue, both at 50% lightness, look quite different in how bright they seem."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
