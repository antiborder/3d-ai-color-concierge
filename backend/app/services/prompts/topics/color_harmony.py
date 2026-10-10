"""color_harmony トピック定義 — カラーハーモニー。

スライド（ColorHarmony.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら ColorHarmony.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "color_harmony",
    "s1": {
        "ja": (
            "カラーハーモニーは、調和して見える色の組み合わせのことです。"
            "多くは、色相環の上の位置関係で決まります。"
            "正反対の2色が補色、正三角形の3色が三角配色、正方形の4色が四角配色です。"
            "どれも、色相環の上で、正多角形の頂点にある色です。"
            "このアプリのColor Harmonyでは、選んだ色をもとに、五角形から九角形までの配色も作れます。"
        ),
        "en": (
            "Color harmony means combinations of colors that look good together. "
            "Most are set by where the colors sit on the color wheel. "
            "Two opposite colors are complementary, three on an equilateral triangle are triadic, "
            "and four on a square are tetradic. "
            "Each is a set of colors at the corners of a regular polygon on the wheel. "
            "This app's Color Harmony can also build schemes from a pentagon up to a nonagon, "
            "starting from the color you pick."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
