"""electromagnetic_wave トピック定義 — 電磁波とは。

スライド（ElectromagneticWave.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ElectromagneticWave.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "electromagnetic_wave",
    "s1": {
        "ja": (
            "電磁波は、電気と磁気の振動が伝わっていく波で、波長によっていろいろな種類があります。"
            "波長が長い方から、電波、赤外線、目に見える光、紫外線、X線、ガンマ線と呼ばれます。"
            "このうち人の目に見えるのは、波長がおよそ380から780ナノメートルのごく狭い範囲だけで、これを可視光といいます。"
            "可視光より少し波長が長い赤外線や、少し短い紫外線は、目には見えません。"
        ),
        "en": (
            "Electromagnetic waves are waves of electric and magnetic vibrations, "
            "and they come in many kinds depending on their wavelength. "
            "From the longest wavelength, they are called radio waves, infrared, visible light, "
            "ultraviolet, X-rays and gamma rays. "
            "Of these, our eyes can see only a very narrow range of about 380 to 780 nanometers, "
            "called visible light. "
            "Infrared, a little longer than visible light, and ultraviolet, a little shorter, "
            "cannot be seen."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
