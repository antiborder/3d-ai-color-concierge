"""hue トピック定義 — 色相。

スライド（Hue.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら Hue.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hue",
    "s1": {
        "ja": (
            "色相は、赤・黄色・緑・青など、色の種類のことです。"
            "HSBやHSLでは、色相を0から360度の角度で表します。"
            "赤が0度、黄色が60度、緑が120度、シアンが180度、青が240度、マゼンタが300度で、360度でまた赤に戻ります。"
            "同じ色相でも、彩度や明るさを変えると、さまざまな色になります。"
        ),
        "en": (
            "Hue is the kind of color, such as red, yellow, green or blue. "
            "In HSB and HSL, hue is given as an angle from 0 to 360 degrees. "
            "Red is 0 degrees, yellow 60, green 120, cyan 180, blue 240 and magenta 300, and at 360 degrees it comes back to red. "
            "Even with the same hue, changing saturation or lightness gives many different colors."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
