"""color_illusion トピック定義 — 色の錯視。

スライド（ColorIllusion.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorIllusion.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_illusion",
    "s1": {
        "ja": (
            "色の錯視は、まわりの色などの影響で、色が実際とは違って見える現象です。"
            "例えば、同じ灰色でも、白い背景の上では暗く、黒い背景の上では明るく見えます。"
            "また、赤い色をしばらく見つめてから白い面を見ると、青緑の残像が見えます。"
            "これは、目の錐体が疲れて、反対の色が浮かび上がるためです。"
        ),
        "en": (
            "Color illusions are when a color looks different from what it really is, because of the colors around it and so on. "
            "For example, the same gray looks darker on a white background and lighter on a black one. "
            "And if you stare at red for a while and then look at a white surface, you see a blue-green afterimage. "
            "That is because the cones in your eyes tire, and the opposite color shows up."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
