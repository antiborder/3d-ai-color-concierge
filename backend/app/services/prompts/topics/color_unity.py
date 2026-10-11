"""color_unity トピック定義 — 色の統一感。

スライド（ColorUnity.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorUnity.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_unity",
    "s1": {
        "ja": (
            "色の統一感を出すには、主に3つの方法があります。"
            "1つ目は、色相をそろえることです。"
            "2つ目は、トーンをそろえて、明るさや鮮やかさを近づけることです。"
            "3つ目は、使う色の数を絞ることです。"
            "色相もトーンもばらばらだと、まとまりのない印象になります。"
        ),
        "en": (
            "There are three main ways to give colors a sense of unity. "
            "The first is to keep the hue the same. "
            "The second is to keep the tone the same, bringing lightness and vividness close together. "
            "The third is to limit the number of colors. "
            "When both hue and tone are all over the place, the result looks scattered."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
