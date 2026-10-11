"""contrast_readability トピック定義 — コントラストと読みやすさ。

スライド（ContrastReadability.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ContrastReadability.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "contrast_readability",
    "s1": {
        "ja": (
            "文字の読みやすさは、色相の違いよりも、文字と背景の明るさの差で決まります。"
            "この差を表すのがコントラスト比で、黒と白なら21対1、同じ色なら1対1です。"
            "ウェブのアクセシビリティの基準では、本文には4.5対1以上が目安とされています。"
            "赤と緑のように、色相が違っても明るさが近いと、読みにくくなります。"
        ),
        "en": (
            "How readable text is depends less on differences in hue than on the difference in lightness between the text and its background. "
            "That difference is expressed as a contrast ratio: 21 to 1 for black and white, and 1 to 1 for the same color. "
            "Web accessibility guidelines recommend at least 4.5 to 1 for body text. "
            "Like red on green, when the lightness is close even though the hues differ, text becomes hard to read."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
