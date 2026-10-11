"""pastel_colors トピック定義 — パステルカラー。

スライド（PastelColors.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら PastelColors.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "pastel_colors",
    "s1": {
        "ja": (
            "パステルカラーは、明るく、彩度が低めの、やわらかい色のことです。"
            "白を多く混ぜたような色で、トーンでいうとペールやライトにあたります。"
            "色相が違っても明るさがそろうので、並べてもまとまりやすく、やさしく軽い印象になります。"
            "日本の伝統色の桜色も、パステルカラーの一つです。"
        ),
        "en": (
            "Pastel colors are soft colors that are light and fairly low in saturation. "
            "They look as if a lot of white were mixed in, and in tone terms they are pale or light. "
            "Since their lightness matches even across hues, they sit well together and feel gentle and light. "
            "Sakura-iro, a Japanese traditional color, is a pastel too."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
