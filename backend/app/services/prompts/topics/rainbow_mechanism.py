"""rainbow_mechanism トピック定義 — 虹が見える仕組み。

スライド（RainbowMechanism.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら RainbowMechanism.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "rainbow_mechanism",
    "s1": {
        "ja": (
            "虹は、太陽の光が雨粒の中を通ることで見えます。"
            "光は雨粒に入るときに曲がりますが、曲がる角度が色ごとに少しずつ違うので、ここで光が色に分かれます。"
            "分かれた光は、雨粒の奥で反射し、"
            "出るときにもう一度曲がって、色ごとに違う向きに出ていきます。"
            "たくさんの雨粒から出た光で、空には赤から紫まで色が並んだ虹が見えます。"
            "これは、高い位置の雨粒からは赤い光が、低い位置の雨粒からは紫の光が、目に届くからです。"
        ),
        "en": (
            "A rainbow appears when sunlight passes through raindrops. "
            "Light bends as it enters a drop, and each color bends by a slightly different angle, "
            "so the light splits into colors here. "
            "The separated light reflects off the back of the drop, "
            "bends again on the way out, and leaves in a different direction for each color. "
            "With the light from many drops, a rainbow with colors from red to violet appears in the sky. "
            "That's because red light reaches your eye from higher drops, and violet light from lower drops."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
