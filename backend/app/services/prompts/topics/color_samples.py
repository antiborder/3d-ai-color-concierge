"""color_samples トピック定義 — 様々なColor Samples。

スライド（ColorSamples.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorSamples.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_samples",
    "s1": {
        "ja": (
            "このアプリでは、4種類の色見本を、色空間の中に点で表示できます。"
            "RGB Cube Gridは、RGBの各軸を7段階に分けた、343色です。"
            "CSS Named Colorsは、ウェブで名前で指定できる色で、トマトやスカイブルーなどがあります。"
            "Material Design Colorsは、Googleのデザイン用の色で、色ごとに明るさの段階があります。"
            "日本の伝統色は、桜色や萌葱色など、昔から使われてきた和の色です。"
            "メニューのColor Samplesで、表示を切り替えられます。"
        ),
        "en": (
            "This app can show four sets of color samples as points in the color space. "
            "The RGB Cube Grid is 343 colors, made by splitting each RGB axis into 7 levels. "
            "CSS Named Colors are colors you can name on the web, such as tomato and sky blue. "
            "Material Design Colors are Google's colors for design, with steps of lightness for each color. "
            "Japanese Traditional Colors, like sakura pink and moegi green, have been used in Japan for centuries. "
            "You can switch them on and off under Color Samples in the menu."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
