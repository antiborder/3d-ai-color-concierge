"""monochrome_colors トピック定義 — モノクロカラー。

スライド（MonochromeColors.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら MonochromeColors.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "monochrome_colors",
    "s1": {
        "ja": (
            "モノクロカラーには、2つの意味があります。"
            "1つは、白・グレー・黒だけの無彩色で、彩度が0の色です。"
            "色みがなくても、明るさの違いだけで形は伝わります。"
            "もう1つは、1つの色相だけで、明るさや鮮やかさを変えて作る単色配色です。"
            "色相が1つなので、統一感が出やすいのが特徴です。"
        ),
        "en": (
            "Monochrome colors have two meanings. "
            "One is achromatic colors, just white, gray and black, with zero saturation. "
            "Even without any hue, shapes come across through differences in lightness alone. "
            "The other is a monochromatic scheme, made from a single hue by changing its lightness and vividness. "
            "With only one hue, it easily feels unified."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
