"""oklch_vs_lch トピック定義 — LCHとOKLCHの違い。

スライド（OklchVsLch.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら OklchVsLch.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "oklch_vs_lch",
    "s1": {
        "ja": (
            "LCHとOKLCHは、どちらも明るさ・鮮やかさ・色相の3つで色を表します。"
            "違いは元になった色空間で、LCHはLab、OKLCHはOKLabを、極座標で表したものです。"
            "この違いは、色相を固定したまま、色を明るくするとよくわかります。"
            "LCHでは、青を明るくすると、だんだん紫に寄っていきます。"
            "OKLCHでは、青は青のまま明るくなります。"
            "そのため、グラデーションや配色を作るときは、OKLCHのほうが色みが崩れにくく、扱いやすくなっています。"
        ),
        "en": (
            "LCH and OKLCH both describe a color by three values: lightness, chroma and hue. "
            "The difference is what they are built on: LCH is Lab, and OKLCH is OKLab, written in polar coordinates. "
            "You can see the difference clearly by making a color lighter while keeping its hue fixed. "
            "In LCH, blue drifts toward purple as it gets lighter. "
            "In OKLCH, blue stays blue as it gets lighter. "
            "That is why OKLCH keeps its tint better and is easier to use for gradients and color schemes."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
