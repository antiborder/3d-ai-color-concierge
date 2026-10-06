"""screen_mechanism トピック定義 — 画面の仕組み。

スライド（ScreenMechanism.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ScreenMechanism.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "screen_mechanism",
    "s1": {
        "ja": (
            "画面は、たくさんの小さな点、画素でできています。"
            "画素を拡大すると、赤・緑・青の小さな光が並んでいます。"
            "小さすぎて見分けられないので、目には混ざった1つの色に見えます。"
            "それぞれの光は256段階で明るさを変えられるので、256の3乗、約1677万色を表せます。"
        ),
        "en": (
            "A screen is made of many tiny dots called pixels. "
            "Magnify a pixel, and you see tiny red, green and blue lights side by side. "
            "They are too small to tell apart, so your eyes see them mixed into one color. "
            "Each light can change its brightness in 256 steps, so 256 to the third power, "
            "about 16.7 million colors, can be shown."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
