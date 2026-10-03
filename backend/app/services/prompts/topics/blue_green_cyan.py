"""blue_green_cyan トピック定義 — 青と緑を混ぜるとシアンになるのはなぜ。

スライド（BlueGreenCyan.tsx → MixedLightSlide.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら MixedLightSlide.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "blue_green_cyan",
    "s1": {
        "ja": (
            "青と緑を混ぜるとシアンに見えるのは、"
            "シアンに対する錐体細胞の反応が、青と緑を見た時の錐体細胞の反応と同じだからです。"
            "この色がシアンです。"
            "シアンを見た時、L、M、S錐体はこのような感度で反応します。"
            "一方で、青と緑を混ぜた光では、"
            "青と緑のそれぞれに"
            "L、M、Sの錐体が反応します。"
            "本当はシアンとは異なる光ですが、"
            "錐体の反応のバランスが同じなので、青と緑を混ぜるとシアンに見えるんです。"
        ),
        "en": (
            "Blue and green mixed look cyan because "
            "the cone cells respond to cyan the same way they respond to blue and green together. "
            "This color is cyan. "
            "When we see cyan, the L, M and S cones respond with these sensitivities. "
            "With blue and green light mixed, on the other hand, "
            "to each of blue and green "
            "the L, M and S cones respond. "
            "It is really a different light from cyan, but "
            "the balance of the cone responses is the same, so blue and green mixed look cyan."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
