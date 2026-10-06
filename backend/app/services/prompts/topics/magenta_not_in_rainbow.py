"""magenta_not_in_rainbow トピック定義 — 虹に無い色：マゼンタ。

スライド（MagentaNotInRainbow.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら MagentaNotInRainbow.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "magenta_not_in_rainbow",
    "s1": {
        "ja": (
            "マゼンタは赤と"
            "青を合わせることで作られます。"
            "虹には全ての色が含まれていると思われがちですが、"
            "マゼンタは虹には含まれていません。"
            "マゼンタが見えるのはLとSの反応が大きく、Mの反応が小さい時ですが、"
            "このような反応は、どの周波数の単色光でも得られないためです。"
            "二つ以上の光を混ぜる必要があります。"
        ),
        "en": (
            "Magenta is made by combining red "
            "and blue light. "
            "People often think a rainbow contains every color, but "
            "magenta is not in the rainbow. "
            "We see magenta when the L and S cones respond strongly and the M cones weakly, but "
            "no single frequency of light gives that response. "
            "Two or more lights have to be mixed."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
