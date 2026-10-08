"""rgb_cube_grid トピック定義 — RGB Cube Grid。

スライド（RgbCubeGrid.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら RgbCubeGrid.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "rgb_cube_grid",
    "s1": {
        "ja": (
            "RGB Cube Gridは、RGB色空間の立方体を、格子状に区切った色見本です。"
            "赤・緑・青のそれぞれを、0から255まで7段階に分けます。"
            "その組み合わせで、7かける7かける7の、343色が並びます。"
            "立方体の中に均等に並ぶので、色空間全体の様子をつかむのに便利です。"
            "各点の色は、HEXコードでも表せます。"
        ),
        "en": (
            "The RGB Cube Grid is a set of color samples that divides the RGB color space's cube into a grid. "
            "Red, green and blue are each split into 7 levels from 0 to 255. "
            "Combining them gives 7 times 7 times 7, or 343 colors. "
            "Since they're spread evenly through the cube, they're handy for getting a feel for the whole color space. "
            "Each point's color can also be written as a HEX code."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
