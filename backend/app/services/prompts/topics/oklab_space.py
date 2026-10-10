"""oklab_space トピック定義 — OKLab色空間。

スライド（OklabSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら OklabSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "oklab_space",
    "s1": {
        "ja": (
            "OKLab色空間は、Labを改良した、新しい色空間です。"
            "Lは明るさ、aは緑から赤、bは青から黄色への軸で、考え方はLabと同じです。"
            "目の錐体の反応をもとに作り直したことで、Labでずれやすかった青のあたりも、見た目どおりに並ぶようになりました。"
            "そのため、2つの色の間をなめらかにつなぐグラデーションも、自然な色になります。"
        ),
        "en": (
            "The OKLab color space is a newer color space that improves on Lab. "
            "L is lightness, a runs from green to red and b from blue to yellow, the same idea as Lab. "
            "Rebuilt from the responses of the eye's cones, it lines up even the blues, which drift in Lab, the way they look. "
            "So gradients that smoothly join two colors come out natural too."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
