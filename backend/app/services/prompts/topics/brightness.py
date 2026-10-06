"""brightness トピック定義 — 明度（HSB の B）。

スライド（Brightness.tsx → LightLevelSlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら LightLevelSlide.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "brightness",
    "s1": {
        "ja": (
            "明度は、HSBのBにあたる明るさの値です。"
            "RGBの3つの値のうち、一番大きい値で決まります。"
            "例えばオレンジは、赤が255で一番大きいので、明度は100%です。"
            "鮮やかな色も白も、明度は100%になります。"
            "ただし、黄色と青はどちらも明度100%ですが、見た目の明るさはかなり違います。"
        ),
        "en": (
            "Brightness is the lightness value that is HSB's B. "
            "It is set by the largest of the three RGB values. "
            "Orange, for example, has red at 255, the largest, so its brightness is 100%. "
            "Vivid colors and white both have a brightness of 100%. "
            "But yellow and blue, both at 100% brightness, look quite different in how bright they seem."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
