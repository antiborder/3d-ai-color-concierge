"""color_size トピック定義 — 色の大きさ。

スライド（ColorSize.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorSize.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_size",
    "s1": {
        "ja": (
            "同じ大きさでも、色によって大きく見えたり、小さく見えたりします。"
            "明るい色や暖かい色は大きく見え、膨張色と呼ばれます。"
            "暗い色や冷たい色は小さく見え、収縮色と呼ばれます。"
            "特に影響が大きいのは明るさです。"
            "例えば囲碁の石は、同じ大きさに見えるように、白い石が黒い石より少し小さく作られています。"
        ),
        "en": (
            "Even at the same size, some colors look bigger and some look smaller. "
            "Light and warm colors look bigger and are called advancing, or expanding, colors. "
            "Dark and cool colors look smaller and are called receding, or contracting, colors. "
            "Lightness has the strongest effect. "
            "Go stones, for example, are made with the white stones slightly smaller than the black ones, so that they look the same size."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
