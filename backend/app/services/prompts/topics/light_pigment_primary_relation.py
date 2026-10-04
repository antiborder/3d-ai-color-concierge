"""light_pigment_primary_relation トピック定義 — 光の三原色と色材の三原色の関係。

スライド（LightPigmentPrimaryRelation.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら LightPigmentPrimaryRelation.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "light_pigment_primary_relation",
    "s1": {
        "ja": (
            "光の三原色と色材の三原色は、補色の関係にあります。"
            "赤・緑・青の間に、隣り合う2色を混ぜた色を置くと、"
            "黄色・シアン・マゼンタ、つまり色材の三原色が並びます。"
            "向かい合う色どうしが補色で、赤とシアン、緑とマゼンタ、青と黄色の組です。"
            "そのため色材は、補色にあたる光を吸収します。"
        ),
        "en": (
            "The primary colors of light and of pigment are complementary to each other. "
            "Between red, green and blue, place the color you get by mixing each neighboring pair: "
            "yellow, cyan and magenta, which are the primary colors of pigment. "
            "Colors facing each other are complementary: red and cyan, green and magenta, "
            "blue and yellow. "
            "That is why each pigment absorbs its complementary light."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
