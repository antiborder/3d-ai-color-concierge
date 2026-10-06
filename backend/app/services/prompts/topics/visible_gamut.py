"""visible_gamut トピック定義 — 人が知覚可能な範囲。

スライド（VisibleGamut.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら VisibleGamut.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "visible_gamut",
    "s1": {
        "ja": (
            "人が見分けられる色は、色度図の馬蹄形の中にすべて収まります。"
            "ふちは、380から700ナノメートルの単色光で、どんな光も単色光の組み合わせなので、その色は必ずこの内側に来ます。"
            "外側は、実在しない色です。"
            "画面で表示できるのは、この中の一部だけです。"
        ),
        "en": (
            "All the colors people can tell apart fit inside the horseshoe of the chromaticity diagram. "
            "Its edge is the single-wavelength lights from 380 to 700 nanometers, and since any light is a mix of single-wavelength lights, its color always lands inside. "
            "Outside are colors that don't exist. "
            "A screen can show only part of it."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
