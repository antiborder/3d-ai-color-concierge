"""material_design_color トピック定義 — Material Design Color。

スライド（MaterialDesignColor.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら MaterialDesignColor.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "material_design_color",
    "s1": {
        "ja": (
            "Material Design Colorは、Googleがデザインのために作った色のパレットです。"
            "赤や青など19の色相ごとに、明るい50から暗い900まで、10段階の色がそろっています。"
            "500がその色の基準で、数字が大きいほど暗くなります。"
            "ただし、同じ番号でも、黄色は明るく、青は暗いなど、明るさは色相によって違います。"
        ),
        "en": (
            "Material Design Colors are a color palette Google made for design. "
            "For each of 19 hues, such as red and blue, there are 10 shades from a light 50 to a dark 900. "
            "500 is each hue's base color, and higher numbers are darker. "
            "But even at the same number, lightness differs by hue: yellow is light and blue is dark."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
