"""sky_blue_reason トピック定義 — 空が青い理由。

スライド（SkyBlueReason.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら SkyBlueReason.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "sky_blue_reason",
    "s1": {
        "ja": (
            "空を見た時に目に入る光は、"
            "太陽光が空気分子で散乱された光です。"
            "青い光の方が、緑や赤よりも散乱されやすいです。"
            "空からあなたへ届く光には様々な波長が含まれていますが青い光が多いため、空は空色に見えます。"
        ),
        "en": (
            "The light that reaches your eyes when you look at the sky "
            "is sunlight scattered by air molecules. "
            "Blue light is scattered more easily than green or red light. "
            "The light that comes to you from the sky contains many wavelengths, "
            "but most of it is blue, so the sky looks sky blue."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
