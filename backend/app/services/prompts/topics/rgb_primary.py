"""rgb_primary トピック定義 — 光の三原色と加法混色。

スライド（RgbPrimary.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら RgbPrimary.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "rgb_primary",
    "s1": {
        "ja": (
            "光の三原色は、赤・緑・青の3色です。"
            "光は重ねるほど明るくなり、赤と緑で黄色、緑と青でシアン、青と赤でマゼンタ、"
            "3色全部で白になります。"
            "テレビやスマホの画面も、小さな赤・緑・青の光の強さを変えて、いろいろな色を作っています。"
        ),
        "en": (
            "The three primary colors of light are red, green and blue. "
            "Light gets brighter as you add more: red and green make yellow, green and blue make cyan, "
            "blue and red make magenta, and all three make white. "
            "TV and phone screens, too, make all their colors by changing the strength of "
            "tiny red, green and blue lights."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
