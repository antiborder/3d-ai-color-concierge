"""SHOW_CONTENT — 色彩理論の教育コンテンツを表示するツール。"""

from __future__ import annotations

CONTENT_IDS = [
    "rgb_primary",  # 光の三原色と加法混色
    "cmy_primary",  # 色材の三原色と減法混色
    "hsb_space",    # HSB色空間（カラーホイール・彩度・明度）
    "hsl_space",    # HSL色空間（カラーホイール・彩度・輝度）
    "lab_space",    # Lab色空間（L*明度バー・a*b*平面）
]

DECLARATIONS: list[dict] = [
    {
        "name": "SHOW_CONTENT",
        "description": (
            "Display an educational slide to visually explain a color theory concept. "
            "Use this when (a) the user asks about a color theory topic, OR (b) the user agrees to learn more after you proactively suggested it. "
            "Call SHOW_CONTENT at the START of your response, then deliver the verbal explanation. "
            "Do NOT call SELECT_COLOR or other action tools in the same response — "
            "reserve demonstrations for the follow-up after the user has seen the slide. "
            f"Available content IDs: {', '.join(CONTENT_IDS)}. "
            "rgb_primary: primary colors of light (red, green, blue) and additive color mixing. "
            "cmy_primary: primary colors of pigment (cyan, magenta, yellow) and subtractive color mixing. "
            "hsb_space: HSB color space — color wheel (hue), saturation (vividness), and brightness. "
            "hsl_space: HSL color space — color wheel (hue), saturation (vividness), and lightness (0=black, 0.5=vivid, 1=white). "
            "lab_space: Lab color space — L* lightness bar (black to white) and a*×b* chrominance plane (green↔red, blue↔yellow). "
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "enum": CONTENT_IDS,
                    "description": "Educational content ID to display.",
                }
            },
            "required": ["id"],
        },
    },
    {
        "name": "DISMISS_CONTENT",
        "description": (
            "Close/dismiss the educational slide currently shown on screen. "
            "Use this when GET_UI_STATE returns a non-null activeSlide and "
            "the current conversation topic is unrelated to that slide, "
            "or when you want to clear the screen for a cleaner view. "
            "Do NOT say 'I'll close the slide' — just call the tool silently."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
]


def _show_content(args: dict) -> dict:
    return {"id": args.get("id")}


COMMANDS: dict[str, object] = {
    "SHOW_CONTENT": _show_content,
    "DISMISS_CONTENT": lambda _args: {},
}

RULES_JA = """\
## SHOW_CONTENT — スライド表示ルール

利用可能なスライド（**5種類のみ**）: rgb_primary（光の三原色・加法混色）、cmy_primary（色材の三原色・減法混色）、hsb_space（HSB色空間）、hsl_space（HSL色空間）、lab_space（Lab色空間）。

**呼ぶタイミング**:
1. 上記トピックへの明示的な質問 → 即座に SHOW_CONTENT を呼ぶ。
2. 会話中に自然に触れた場合 → 提案は**3回に1回程度**。「〇〇をスライドで確認しますか？」と口頭提案し、同意されたら次ターンで呼ぶ（毎回提案しない）。

**スライドがないトピック**（LCH・補色・トーン・XYZ等）では SHOW_CONTENT を呼ばない。

**呼び方**: SHOW_CONTENT でスライドは自動表示される。「表示します」「見てみましょう」等は言わない。まず SHOW_CONTENT を呼び、その後音声で簡潔に説明（定義1文＋補足1文）。CHANGE_SHAPE と同じレスポンスで呼んでよいが、SELECT_COLOR は呼ばない。

## DISMISS_CONTENT

GET_UI_STATE で activeSlide が null 以外かつ話題と無関係なら呼ぶ。「閉じます」等の言及は不要。\
"""

RULES_EN = """\
## SHOW_CONTENT — Slide display rules

Available slides (**exactly 5**): rgb_primary (light primaries / additive mixing), cmy_primary (pigment primaries / subtractive mixing), hsb_space, hsl_space, lab_space.

**When to call (trigger on either — no throttle):**
1. The user explicitly asks about one of these topics → call SHOW_CONTENT immediately.
2. The conversation naturally touches on one → offer it verbally in that same response: "Would you like to see a visual on [topic]?" If the user agrees next turn, call SHOW_CONTENT then.

**Topics without slides** (LCH, complementary colors, tones, XYZ, etc.): do NOT call SHOW_CONTENT.

**How to call:** SHOW_CONTENT displays the slide automatically — do NOT say "let me show you a slide". Call it first, then give a 2-sentence verbal explanation (definition + follow-up). May be called together with CHANGE_SHAPE. Do NOT call SELECT_COLOR.

## DISMISS_CONTENT

Call when GET_UI_STATE returns a non-null activeSlide unrelated to the current topic. Do not verbally mention closing it.\
"""
