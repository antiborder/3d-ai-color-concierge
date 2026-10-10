"""color_weight トピック定義 — 色の重み。

スライド（ColorWeight.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorWeight.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_weight",
    "s1": {
        "ja": (
            "色には、重さの印象もあります。"
            "暗い色は重く、明るい色は軽く感じられます。"
            "この印象を決めるのは主に明るさで、色相の影響は小さめです。"
            "例えば、同じ箱でも、黒い箱は白い箱より重そうに見えます。"
            "そのため、デザインでは暗い色を下に、明るい色を上に置くと、安定して見えます。"
        ),
        "en": (
            "Colors also give an impression of weight. "
            "Dark colors feel heavy, and light colors feel light. "
            "This impression comes mainly from lightness; hue matters less. "
            "The same box, for example, looks heavier in black than in white. "
            "So in design, putting dark colors at the bottom and light colors at the top looks stable."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
