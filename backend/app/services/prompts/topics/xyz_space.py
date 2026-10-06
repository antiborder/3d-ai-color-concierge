"""xyz_space トピック定義 — CIE XYZ色空間。

スライド（XyzSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら XyzSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "xyz_space",
    "s1": {
        "ja": (
            "XYZ色空間は、国際照明委員会が1931年に定めた、色を表す世界共通の基準です。"
            "光の色を、この3本の曲線で測ったX・Y・Zの3つの値で表します。"
            "曲線は等色実験をもとに、マイナスにならないよう作られています。"
            "特にYは、人が感じる明るさを表します。"
            "XYZは機器によらないので、画面のRGBなど多くの色空間が、XYZを基準に定義されています。"
        ),
        "en": (
            "XYZ color space is the worldwide standard for describing color, "
            "set by the International Commission on Illumination in 1931. "
            "It describes the color of light with three values, X, Y and Z, "
            "measured with these three curves. "
            "The curves are based on color matching experiments and made so they never go negative. "
            "Y in particular represents the brightness people perceive. "
            "Because XYZ does not depend on any device, many color spaces, "
            "including the RGB of screens, are defined from it."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
