"""triadic_colors トピック定義 — 三角配色。

スライド（TriadicColors.tsx → HarmonySlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HarmonySlide.tsx の STEPS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "triadic_colors",
    "s1": {
        "ja": (
            "三角配色は、色相環を3等分した位置にある3色の組み合わせです。"
            "色相環の上で、正三角形の頂点になります。"
            "例えばオレンジから始めると、残りの2色は青緑と紫です。"
            "3色が離れているので、にぎやかでバランスの取れた印象になります。"
            "1色を主役にして、残りを少なめに使うとまとまります。"
            "このアプリのColor Harmonyで、選んだ色の三角配色を表示できます。"
        ),
        "en": (
            "A triadic color scheme is three colors that divide the color wheel into thirds. "
            "On the wheel, they are the corners of an equilateral triangle. "
            "Starting from orange, for example, the other two are teal and purple. "
            "Since the three colors are far apart, the result feels lively yet balanced. "
            "Making one color the main one and using the others less keeps it together. "
            "This app's Color Harmony can show the triadic scheme of the color you pick."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
