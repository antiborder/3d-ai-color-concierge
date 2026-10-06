"""xyz_lms_relation トピック定義 — XYZ座標とLMS座標の関係。

スライド（XyzLmsRelation.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら XyzLmsRelation.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "xyz_lms_relation",
    "s1": {
        "ja": (
            "LMSは、目の3種類の錐体の反応を、そのまま3つの値にしたものです。"
            "XYZは、このLMSを、決まった割合で足したり引いたりして作れます。"
            "例えばZはほぼSと同じ、YはLとMを足したもので、明るさを表します。"
            "逆の計算をすれば、XYZからLMSにも戻せるので、2つは同じ色を別の軸で表したものです。"
        ),
        "en": (
            "LMS takes the responses of the eye's three kinds of cones directly as three values. "
            "XYZ can be made from LMS by adding and subtracting them in fixed proportions. "
            "For example, Z is almost the same as S, and Y adds L and M together "
            "and represents brightness. "
            "The reverse calculation turns XYZ back into LMS, "
            "so the two describe the same colors with different axes."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
