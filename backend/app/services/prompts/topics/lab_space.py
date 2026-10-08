"""lab_space トピック定義 — Lab色空間。

スライド（LabSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら LabSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "lab_space",
    "s1": {
        "ja": (
            "Lab色空間は、人の見え方に近づけた色空間です。"
            "Lは明るさで、0が黒、100が白です。"
            "aは緑から赤、bは青から黄色への軸で、"
            "人の目が、赤と緑、黄色と青を、反対の色として感じる仕組みにもとづいています。"
            "2つの色の距離が、見た目の色の差にほぼ対応するので、色の違いを数値で比べられます。"
        ),
        "en": (
            "The Lab color space is designed to be closer to how people see color. "
            "L is lightness, from 0 for black to 100 for white. "
            "a runs from green to red and b from blue to yellow, "
            "based on how our eyes sense red and green, and yellow and blue, as opposing colors. "
            "The distance between two colors roughly matches how different they look, "
            "so color differences can be compared as numbers."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
