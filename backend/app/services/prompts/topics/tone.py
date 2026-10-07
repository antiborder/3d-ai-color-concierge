"""tone トピック定義 — トーン（色調）。

スライド（Tone.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら Tone.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "tone",
    "s1": {
        "ja": (
            "トーンは、色調とも呼ばれ、明るさと鮮やかさを組み合わせた、色の調子のことです。"
            "横に鮮やかさ、縦に明るさをとると、ひとつの色相の色は、このようなグループに分けられます。"
            "鮮やかなビビッド、明るく淡いペール、暗いダーク、灰色がかったグレイッシュなどです。"
            "トーンは色相とは別なので、色相が違っても、同じトーンなら似た印象になります。"
        ),
        "en": (
            "Tone is the overall character of a color, combining how light and how vivid it is. "
            "With vividness across and lightness up, the colors of one hue fall into groups like these. "
            "There's vivid, pale which is light and soft, dark, and grayish, among others. "
            "Tone is separate from hue, so colors of different hues in the same tone give a similar impression."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
