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
            "Use this when GET_CURRENT_COLOR returns a non-null activeSlide and "
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

利用可能なスライド（**5種類のみ**）:
- rgb_primary（光の三原色・加法混色）
- cmy_primary（色材の三原色・減法混色）
- hsb_space（HSB色空間）
- hsl_space（HSL色空間）
- lab_space（Lab色空間）

**呼び出すタイミング（これらのいずれかに当てはまれば毎回呼ぶ）:**
1. ユーザーが上記トピックについて明示的に質問した場合 → 即座に SHOW_CONTENT を呼ぶ。
2. 会話の中で上記トピックに自然に触れた場合 → その発話の中で「〇〇についてスライドで確認してみますか？」と口頭で提案する。次のターンでユーザーが同意したら SHOW_CONTENT を呼ぶ。

**スライドがないトピック**（LCH・補色・トーン・XYZ等）では SHOW_CONTENT を呼ばないこと。

**呼び方のルール:**
- SHOW_CONTENT を呼ぶとスライドが自動表示されます。「スライドを表示します」「見てみましょう」などの文言は言わないこと。
- スライドを表示するときは、まず SHOW_CONTENT を呼び、その後で音声で簡潔に説明する（定義1文＋補足1文）。
- CHANGE_SHAPE と SHOW_CONTENT は同じレスポンスで呼び出してよい。SELECT_COLOR は呼ばないこと。

## DISMISS_CONTENT

GET_CURRENT_COLOR の結果で activeSlide が null 以外のとき、そのスライドが今の話題と無関係なら呼び出すこと。「スライドを閉じます」などの言及は不要。\
"""

RULES_EN = """\
## SHOW_CONTENT — Slide display rules

Available slides (**exactly 5**):
- rgb_primary (primary colors of light / additive mixing)
- cmy_primary (primary colors of pigment / subtractive mixing)
- hsb_space (HSB color space)
- hsl_space (HSL color space)
- lab_space (Lab color space)

**When to call (trigger on ANY of these — no throttle):**
1. The user explicitly asks about one of the above topics → call SHOW_CONTENT immediately.
2. The conversation naturally touches on one of these topics → verbally offer it in that same response: "Would you like to see a visual on [topic]?" If the user agrees in the next turn, call SHOW_CONTENT then.

**Topics without slides** (LCH, complementary colors, tones, XYZ, etc.): do NOT call SHOW_CONTENT.

**How to call:**
- SHOW_CONTENT displays the slide automatically — do NOT say "let me show you a slide" or "here's a diagram". Call the tool, then explain directly.
- When showing a slide, call SHOW_CONTENT first, then give a verbal explanation in 2 sentences.
- CHANGE_SHAPE and SHOW_CONTENT may be called together. Do NOT call SELECT_COLOR.

## DISMISS_CONTENT

Call when GET_CURRENT_COLOR returns a non-null activeSlide and the current topic is unrelated to that slide. Do not verbally mention closing it.\
"""
