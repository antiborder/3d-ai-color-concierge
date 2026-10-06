"""chromaticity_diagram トピック定義 — 色度図。

スライド（ChromaticityDiagram.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ChromaticityDiagram.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "chromaticity_diagram",
    "s1": {
        "ja": (
            "色度図は、XYZから明るさを取り除き、色みだけを平面に並べた図です。"
            "XとYとZの合計で割った、小文字のxとyを座標にします。"
            "馬蹄形のふちには、虹の単色光が波長の順に並び、下の直線には、マゼンタなど虹にない色が並びます。"
            "中心付近が白で、2つの光を混ぜた色は、2点を結ぶ直線の上に来ます。"
        ),
        "en": (
            "The chromaticity diagram takes XYZ, removes brightness, and lays out just the hue and vividness of colors on a flat plane. "
            "Its coordinates are lowercase x and y, which are X and Y divided by the sum of X, Y and Z. "
            "Along the curved edge of the horseshoe, the rainbow's single-wavelength lights line up in order of wavelength, and along the straight bottom edge are colors not in the rainbow, such as magenta. "
            "White is near the middle, and a mix of two lights lands on the straight line between their two points."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
