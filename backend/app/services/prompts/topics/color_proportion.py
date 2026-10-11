"""color_proportion トピック定義 — 配色の比率。

スライド（ColorProportion.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorProportion.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_proportion",
    "s1": {
        "ja": (
            "配色は、ベースカラー、メインカラー、アクセントカラーの3つの役割で考えると、まとまりやすくなります。"
            "ベースは背景など広い面に使う色、メインは主役の色、アクセントは目を引くために少しだけ使う色です。"
            "比率は、70対25対5が目安です。"
            "アクセントを少しに抑えることで、全体はまとまり、大事なところが目立ちます。"
        ),
        "en": (
            "A color scheme comes together more easily if you think of three roles: a base color, a main color and an accent color. "
            "The base is used on large areas like the background, the main is the leading color, and the accent is used just a little to catch the eye. "
            "A common rule of thumb is 60-30-10. "
            "Keeping the accent small holds the whole together while making the important parts stand out."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
