"""lab_vs_oklab トピック定義 — LabとOKLabの違い。

スライド（LabVsOklab.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら LabVsOklab.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "lab_vs_oklab",
    "s1": {
        "ja": (
            "LabとOKLabは、どちらも明るさのL、赤と緑のa、青と黄色のbの3つで色を表します。"
            "違いは作り方で、LabはXYZから、OKLabは目の錐体の応答を表すLMSを経由して作られています。"
            "数値の大きさも違い、同じオレンジが、Labでは67・43・74、OKLabでは0.73・0.11・0.15です。"
            "違いがよくわかるのは、2つの色をつなぐグラデーションです。"
            "Labで青と白をつなぐと、途中が紫っぽくなります。"
            "OKLabでは、途中も青のまま、なめらかにつながります。"
            "そのため、OKLabはグラデーションや色の計算に向いています。"
        ),
        "en": (
            "Lab and OKLab both describe a color by three values: L for lightness, a for red to green, and b for blue to yellow. "
            "The difference is how they are built: Lab comes from XYZ, while OKLab goes through LMS, the response of the eye's cones. "
            "Their numbers differ in size too: the same orange is 67, 43, 74 in Lab, but 0.73, 0.11, 0.15 in OKLab. "
            "The difference shows best in a gradient joining two colors. "
            "Join blue and white in Lab, and the middle turns purplish. "
            "In OKLab, the middle stays blue and the colors join smoothly. "
            "That is why OKLab suits gradients and color calculations."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
