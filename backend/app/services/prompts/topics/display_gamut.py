"""display_gamut トピック定義 — 画面で表示可能な範囲。

スライド（DisplayGamut.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら DisplayGamut.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "display_gamut",
    "s1": {
        "ja": (
            "画面に表示できる色は、色度図の上では、三角形の中だけです。"
            "三角形の角は、画面の赤・緑・青の光の色で、この3色を混ぜても、三角形の外の色は作れません。"
            "特に、鮮やかな緑や青緑の多くは、画面では表示できません。"
            "最近の画面には、より広い三角形を表示できるものもあります。"
        ),
        "en": (
            "On the chromaticity diagram, the colors a screen can show are only those inside a triangle. "
            "The triangle's corners are the colors of the screen's red, green and blue lights, and mixing these three can't make colors outside the triangle. "
            "In particular, many vivid greens and blue-greens can't be shown on a screen. "
            "Some newer screens can show a wider triangle."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
