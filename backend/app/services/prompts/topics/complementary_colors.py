"""complementary_colors トピック定義 — 補色。

スライド（ComplementaryColors.tsx → HarmonySlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HarmonySlide.tsx の STEPS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "complementary_colors",
    "s1": {
        "ja": (
            "補色は、色相環で正反対にある2色の組み合わせです。"
            "例えばオレンジの補色は、反対側にある水色です。"
            "補色どうしを並べると、お互いを引き立て合って、とても目立ちます。"
            "目立たせたい部分にだけ、補色を少し使うのが効果的です。"
            "このアプリのColor Harmonyで、選んだ色の補色を表示できます。"
        ),
        "en": (
            "Complementary colors are two colors directly opposite each other on the color wheel. "
            "For example, the complement of orange is the sky blue on the opposite side. "
            "Placed side by side, complementary colors bring each other out and stand out strongly. "
            "It works best to use the complement just a little, only where you want something to stand out. "
            "This app's Color Harmony can show the complement of the color you pick."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
