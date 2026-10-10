"""warm_cool_colors トピック定義 — 暖色と寒色。

スライド（WarmCoolColors.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら WarmCoolColors.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "warm_cool_colors",
    "s1": {
        "ja": (
            "暖色と寒色は、色から感じる暖かさや冷たさによる分け方です。"
            "赤、オレンジ、黄色などが暖色で、暖かく、活発な印象を与えます。"
            "青緑、青などが寒色で、涼しく、落ち着いた印象を与えます。"
            "緑や紫は、どちらでもない中性色です。"
            "そのため、飲食店では暖色が、病院やオフィスでは寒色がよく使われます。"
        ),
        "en": (
            "Warm and cool colors are grouped by how warm or cold a color feels. "
            "Red, orange and yellow are warm colors, giving a warm, lively impression. "
            "Blue-green and blue are cool colors, giving a cool, calm impression. "
            "Green and purple are neither; they are neutral colors. "
            "That is why restaurants often use warm colors, while hospitals and offices often use cool ones."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
