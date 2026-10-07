"""hue_circle トピック定義 — 色相環。

スライド（HueCircle.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HueCircle.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hue_circle",
    "s1": {
        "ja": (
            "色相環は、色相を円の上に順番に並べたものです。"
            "赤・黄色・緑・シアン・青・マゼンタと並び、マゼンタの次はまた赤につながります。"
            "虹の色は赤から始まり紫で終わりますが、色相環では、虹にないマゼンタが両端をつないで、輪になります。"
            "円の向かい側にある色どうしは補色で、補色どうしの光を混ぜると白になります。"
        ),
        "en": (
            "A color wheel arranges hues in order around a circle. "
            "Red, yellow, green, cyan, blue and magenta go around, and after magenta it connects back to red. "
            "The rainbow starts at red and ends at violet, but on the color wheel, magenta, which isn't in the rainbow, joins the two ends into a ring. "
            "Colors facing each other across the circle are complementary, and mixing the light of two complementary colors gives white."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
