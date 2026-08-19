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
- **重要 — 無彩色とハーモニーの制約**: ハーモニーは「色相（H）を回転させながら彩度（S）と明度（L）は固定」で計算されます。S ≈ 0（白・黒・グレーや無彩色に近い色）の場合、色相を何度回転させても視覚的効果はゼロ — ハーモニーの全色が同じに見えます。SET_HARMONY を呼ぶ前に必ず GET_UI_STATE を呼んで彩度「s」を確認してください。s < 15 の場合は SET_HARMONY を呼ばないでください。代わりにユーザーへ説明してください：「この色は彩度がとても低い（白・グレー・黒に近い）ため、ハーモニーを適用しても全色が同じに見えてしまいます。彩度の高い色を先に選ぶか、彩度を上げてからお試しください。」低彩度の別の色で再試行しても結果は同じです — 絶対に繰り返さないでください。\
"""

RULES_EN = """\
- **SET_HARMONY must be called proactively** — not only when the user explicitly requests it, but whenever you: recommend complementary colors, suggest a dramatic hue change, explain any color harmony theory (triadic, tetradic, etc.), or want to visually demonstrate color relationships. Use mode='none' to clear harmony markers when the topic moves away from harmony.
- **CRITICAL — achromatic colors and harmony**: Harmony is computed by rotating the Hue angle while keeping Saturation (S) and Lightness (L) fixed. When S ≈ 0 (white, black, gray, or near-gray), rotating Hue has zero visual effect — ALL harmony colors will appear identical. Before calling SET_HARMONY, call GET_UI_STATE and check the saturation value "s". If s < 15, DO NOT call SET_HARMONY. Instead, explain to the user: "Since this color has very low saturation (it's close to white/gray/black), all harmony colors would look identical. Please choose a more saturated color first, or I can increase the saturation for you." Never retry SET_HARMONY with a slightly different low-saturation color — the result will always be the same.\
"""
