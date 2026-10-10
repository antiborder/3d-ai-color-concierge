"""tetradic_colors トピック定義 — 四角配色。

スライド（TetradicColors.tsx → HarmonySlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HarmonySlide.tsx の STEPS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "tetradic_colors",
    "s1": {
        "ja": (
            "四角配色は、色相環の上で正方形をなす4色の組み合わせです。"
            "補色の組を2つ合わせた配色でもあります。"
            "例えばオレンジから始めると、緑、水色、紫が加わります。"
            "色数が多く華やかですが、まとめるのが難しいので、1色を主役にして、ほかは控えめに使うのがコツです。"
            "このアプリのColor Harmonyで、選んだ色の四角配色を表示できます。"
        ),
        "en": (
            "A tetradic color scheme is four colors that form a square on the color wheel. "
            "It is also two pairs of complementary colors put together. "
            "Starting from orange, for example, green, sky blue and purple join in. "
            "With many colors it looks rich but is hard to pull together, so the trick is to make one color the main one and use the others sparingly. "
            "This app's Color Harmony can show the tetradic scheme of the color you pick."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
