"""color_matching_experiment トピック定義 — 等色実験とは。

スライド（ColorMatchingExperiment.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorMatchingExperiment.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_matching_experiment",
    "s1": {
        "ja": (
            "等色実験は、見たい色と、3つの光を混ぜた色を、並べて見比べる実験です。"
            "3つの光の強さを調整して、2つが同じ色に見えるところを探します。"
            "同じに見えたときの3つの光の量を記録します。"
            "これをすべての波長で行い、グラフにしたものが等色関数です。"
            "波長によっては、赤の光をマイナスにしないと一致しません。"
            "これは、見たい色の側に赤い光を足したという意味です。"
            "この結果をもとに、XYZ色空間が作られました。"
        ),
        "en": (
            "A color matching experiment puts a target color side by side with a mix of three lights. "
            "You adjust the strength of the three lights to find where the two look the same. "
            "Then you record how much of each light it took. "
            "Doing this for every wavelength and graphing the results gives the color matching functions. "
            "For some wavelengths, the red light has to be negative to get a match. "
            "That means red light was added to the target side instead. "
            "The XYZ color space was built from these results."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
