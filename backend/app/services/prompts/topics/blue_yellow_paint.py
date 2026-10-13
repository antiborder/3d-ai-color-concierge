"""blue_yellow_paint トピック定義 — 青と黄色の絵の具を混ぜると緑になるのはなぜ。

スライド（BlueYellowPaint.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら BlueYellowPaint.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "blue_yellow_paint",
    "s1": {
        "ja": (
            "色材の三原色のルールでは、青はシアンとマゼンタを混ぜた色です。"
            "そこに黄色を加えると、三原色がすべて混ざって黒になります。"
            "ところが、実際の青と黄色の絵の具を混ぜると、緑になります。"
            "実際の絵の具は、光を3つにきっちり分けて吸収するのではなく、なだらかに反射するからです。"
            "青い絵の具は緑の光も少し反射し、黄色い絵の具も緑の光を反射します。"
            "両方が反射する緑の光だけが残るので、混ぜると緑に見えるのです。"
            "ただし、結果は絵の具の種類によって変わります。"
        ),
        "en": (
            "By the rules of the pigment primaries, blue is a mix of cyan and magenta. "
            "Add yellow, and all three primaries are mixed, which makes black. "
            "Yet when you actually mix blue and yellow paint, you get green. "
            "Real paints don't absorb light in three neat parts; they reflect it gradually. "
            "Blue paint also reflects a little green light, and yellow paint reflects green light too. "
            "Only the green light that both reflect is left, so the mix looks green. "
            "The result does depend on the kind of paint, though."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
