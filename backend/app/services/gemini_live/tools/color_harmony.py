"""SET_HARMONY — ハーモニーマーカー表示ツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "SET_HARMONY",
        "description": (
            "Show or hide color harmony markers in 3D space. "
            "Use mode='none' to hide markers when the topic is no longer about harmony. "
            "Modes: 'complementary' (2 colors, 180°), 'triangle' (3, 120°), 'square' (4, 90°), "
            "'pentagon' (5, 72°), 'hexagon' (6, 60°), 'heptagon' (7), 'octagon' (8, 45°), 'nonagon' (9, 40°)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "mode": {
                    "type": "string",
                    "enum": [
                        "none",
                        "complementary",
                        "triangle",
                        "square",
                        "pentagon",
                        "hexagon",
                        "heptagon",
                        "octagon",
                        "nonagon",
                    ],
                    "description": "Harmony mode to display. Use 'none' to clear harmony markers.",
                }
            },
            "required": ["mode"],
        },
    },
]


def _set_harmony(args: dict) -> dict:
    return {"mode": args.get("mode")}


COMMANDS: dict[str, object] = {
    "SET_HARMONY": _set_harmony,
}

RULES_JA = """\
- **SET_HARMONY はユーザーから明示的に指示されなくても積極的に呼び出してください**。以下の場面では必ず呼び出すこと：補色をおすすめするとき、色相を大きく変えることを提案するとき、配色理論（補色・三角配色・四角配色など）を説明するとき、色の関係性を視覚的に見せたいとき。ハーモニーの話題が終わったら mode='none' で非表示にしてください。
- **ハーモニーの計算方法**: OkLCH色空間で計算します。選んだ色の色相（H）だけを回転させ、明るさ（L）は元の色のまま固定し、鮮やかさ（C）は全色が画面で表示できる値にそろえます。計算方法を聞かれたら「OkLCH色空間で計算している」と答えてください（HSLではありません）。
- **重要 — 無彩色とハーモニーの制約**: 鮮やかさがほぼ0（白・黒・グレーや無彩色に近い色）の場合、色相を何度回転させても視覚的効果はゼロ — ハーモニーの全色が同じに見えます。SET_HARMONY を呼ぶ前に必ず GET_UI_STATE を呼んで、判定の目安として彩度「s」を確認してください。s < 15 の場合は SET_HARMONY を呼ばないでください。代わりにユーザーへ説明してください：「この色は彩度がとても低い（白・グレー・黒に近い）ため、ハーモニーを適用しても全色が同じに見えてしまいます。彩度の高い色を先に選ぶか、彩度を上げてからお試しください。」低彩度の別の色で再試行しても結果は同じです — 絶対に繰り返さないでください。\
"""

RULES_EN = """\
- **SET_HARMONY must be called proactively** — not only when the user explicitly requests it, but whenever you: recommend complementary colors, suggest a dramatic hue change, explain any color harmony theory (triadic, tetradic, etc.), or want to visually demonstrate color relationships. Use mode='none' to clear harmony markers when the topic moves away from harmony.
- **How harmony is computed**: in the OkLCH color space. Only the hue (H) of the chosen color is rotated; its lightness (L) is kept, and the chroma (C) is set to a value every harmony color can show on screen. If asked how it is computed, say it uses the OkLCH color space (not HSL).
- **CRITICAL — achromatic colors and harmony**: When a color has almost no chroma (white, black, gray, or near-gray), rotating the hue has zero visual effect — ALL harmony colors will appear identical. Before calling SET_HARMONY, call GET_UI_STATE and check the saturation value "s" as an indicator. If s < 15, DO NOT call SET_HARMONY. Instead, explain to the user: "Since this color has very low saturation (it's close to white/gray/black), all harmony colors would look identical. Please choose a more saturated color first, or I can increase the saturation for you." Never retry SET_HARMONY with a slightly different low-saturation color — the result will always be the same.\
"""
