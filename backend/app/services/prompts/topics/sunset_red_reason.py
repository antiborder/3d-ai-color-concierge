"""sunset_red_reason トピック定義 — 夕焼けが赤い理由。

スライド（SunsetRedReason.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら SunsetRedReason.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "sunset_red_reason",
    "s1": {
        "ja": (
            "昼間は太陽が高いので、太陽の光が空気の中を通る距離は短くなります。"
            "夕方は太陽が低くなり、光は空気の中を長い距離通ってから目に届きます。"
            "その途中で、散乱されやすい青い光はほとんど散らばってなくなり、"
            "散乱されにくい赤やオレンジの光が残って目に届くので、夕焼けは赤く見えるのです。"
        ),
        "en": (
            "In the daytime the sun is high, so sunlight travels only a short distance through the air. "
            "In the evening the sun is low, and its light travels a long way through the air "
            "before reaching your eyes. "
            "Along the way, blue light, which scatters easily, is almost all scattered away, "
            "and the red and orange light, which scatters less, is left to reach your eyes, "
            "so the sunset looks red."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
