"""red_green_yellow トピック定義 — 赤と緑を混ぜると黄色になるのはなぜ。

スライド（RedGreenYellow.tsx → MixedLightSlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら MixedLightSlide.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "red_green_yellow",
    "s1": {
        "ja": (
            "赤と緑を混ぜると黄色に見えるのは、"
            "黄色に対する錐体細胞の反応が、赤と緑を見た時の錐体細胞の反応と同じだからです。"
            "この色が黄色です。"
            "黄色を見た時、L、M、S錐体はこのような感度で反応します。"
            "一方で、赤と緑を混ぜた光では、"
            "赤と緑のそれぞれに"
            "L、M、Sの錐体が反応します。"
            "本当は黄色とは異なる光ですが、"
            "これらを合わせると、錐体の反応のバランスがだいたい同じなので、赤と緑を混ぜると黄色に見えるんです。"
        ),
        "en": (
            "Red and green mixed look yellow because "
            "the cone cells respond to yellow the same way they respond to red and green together. "
            "This color is yellow. "
            "When we see yellow, the L, M and S cones respond with these sensitivities. "
            "With red and green light mixed, on the other hand, "
            "to each of red and green "
            "the L, M and S cones respond. "
            "It is really a different light from yellow, but "
            "the balance of the cone responses is the same, so red and green mixed look yellow."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
