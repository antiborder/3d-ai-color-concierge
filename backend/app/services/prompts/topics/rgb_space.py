"""rgb_space トピック定義 — RGB色空間。

スライド（RgbSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら RgbSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "rgb_space",
    "s1": {
        "ja": (
            "RGB色空間は、赤・緑・青の強さを3つの軸にした色空間です。"
            "それぞれ0から255なので、全体は立方体になります。"
            "原点は黒、反対の角は白です。"
            "残りの角は、赤・緑・青と、シアン・マゼンタ・黄色です。"
            "対角線上にはグレーが並びます。"
            "例えばオレンジは、この点で表せます。"
        ),
        "en": (
            "RGB color space uses the strengths of red, green and blue as its three axes. "
            "Each runs from 0 to 255, so the space is a cube. "
            "The origin is black, and the opposite corner is white. "
            "The other corners are red, green, blue, cyan, magenta and yellow. "
            "Grays line the diagonal. "
            "Orange, for example, is this point."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
