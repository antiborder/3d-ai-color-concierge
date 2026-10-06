"""cmyk_space トピック定義 — CMYK色空間。

スライド（CmykSpace.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら CmykSpace.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "cmyk_space",
    "s1": {
        "ja": (
            "CMYK色空間は、印刷に使うインクの量で色を表します。"
            "シアン・マゼンタ・イエローを、それぞれ0から100%で重ねると、色は立方体の中に並びます。"
            "原点は何も塗らない紙の白、反対の角は3色を重ねた黒です。"
            "ただし実際のインクを3色重ねても、濁った黒にしかなりません。"
            "そこで黒のインク、Kを加えた4色で印刷します。"
        ),
        "en": (
            "CMYK color space describes a color by the amounts of ink used in printing. "
            "Layer cyan, magenta and yellow, each from 0 to 100%, and the colors fill a cube. "
            "The origin is the white of bare paper, and the opposite corner is black, "
            "with all three inks layered. "
            "But real inks layered together only make a muddy dark color. "
            "So printing adds black ink, K, and uses four colors."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
