"""color_contrast トピック定義 — コントラスト（色の対比）。

スライド（ColorContrast.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorContrast.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_contrast",
    "s1": {
        "ja": (
            "コントラストは、色どうしの差のことで、差が大きいほど、はっきりと目立ちます。"
            "明るさの差による明度対比、鮮やかさの差による彩度対比、色の種類の差による色相対比があります。"
            "中でも、補色どうしを並べる補色対比は、最も強く目立ちます。"
            "目立たせたい所はコントラストを強く、落ち着かせたい所は弱くするのが、配色の基本です。"
        ),
        "en": (
            "Contrast is the difference between colors, and the bigger the difference, the more clearly things stand out. "
            "There is lightness contrast, from differences in lightness; saturation contrast, from differences in vividness; "
            "and hue contrast, from differences in the kind of color. "
            "Above all, complementary contrast, placing complementary colors side by side, stands out the most. "
            "The basic rule of color schemes is strong contrast where you want attention, and weak contrast where you want calm."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
