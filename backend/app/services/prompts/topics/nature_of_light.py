"""nature_of_light トピック定義 — 光の正体。

スライド（NatureOfLight.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら NatureOfLight.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "nature_of_light",
    "s1": {
        "ja": (
            "光の正体は、電気と磁気の振動が空間を伝わっていく波で、電磁波の一種です。"
            "波の山から次の山までの長さを、波長といいます。"
            "波長が短い光は青く、中くらいの光は緑に、長い光は赤く見えます。"
            "太陽の光にはいろいろな波長の光が混ざっていて、全部が混ざると白く見えます。"
        ),
        "en": (
            "Light is a wave of electric and magnetic vibrations traveling through space, "
            "a kind of electromagnetic wave. "
            "The length from one crest to the next is called the wavelength. "
            "Light with a short wavelength looks blue, a medium one looks green, "
            "and a long one looks red. "
            "Sunlight is a mix of light of many wavelengths, and all of them mixed together look white."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
