"""GET_UI_STATE / GET_CLOSEST_COLOR / GET_COLOR_HISTORY / SEARCH_COLOR — 色情報クエリツール群。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "GET_UI_STATE",
        "description": (
            "Get the full current UI state snapshot from the frontend. "
            "ALWAYS call this as the very FIRST tool call at the start of every user interaction, "
            "before generating any response or calling any other tool. "
            "The response contains: "
            "(1) color values (r, g, b, h, s, l, etc.); "
            "(2) color.shape — the active 3D color space (RGB / CMYK / HSL / HSB / Lab / LCH); "
            "(3) color.mainElement — which axis is currently fixed in the 3D view (e.g. 'L', 'H', 'C'); "
            "(4) color.uiContext.colorSamples — which color sets are visible in 3D space "
            "    (css, material, japanese, rgbGrid — true means visible); "
            "(5) color.uiContext.activeSlide — ID of the educational slide currently shown on screen "
            "    (null means none is shown); "
            "(6) color.uiContext.harmony — current harmony mode "
            "    ('none' means off, 'complementary', 'triangle', 'square', 'pentagon', 'hexagon', etc.); "
            "(7) color.uiContext.background — the background color (#rrggbb). "
            "Use this to decide what to say, what to dismiss (DISMISS_CONTENT), and what to show "
            "(SHOW_CONTENT, SET_COLOR_SETS, CHANGE_SHAPE)."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "GET_CLOSEST_COLOR",
        "description": (
            "Find the closest matching color names from the database for the selected color, "
            "or for the background with target='background'. "
            "Use this when the user asks 'what color is this?', 'what is this color called?', "
            "'what Japanese traditional color is closest to this?', or any question about identifying the current color by name. "
            "Returns the top 5 closest colors with their names, hex codes, and RGB distance. "
            "Describe the results using the color names — do NOT mention RGB values or distance numbers to the user."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "enum": ["focused", "background"],
                    "description": "'background' when the user asks about the background; otherwise 'focused'.",
                },
            },
        },
    },
    {
        "name": "GET_COLOR_HISTORY",
        "description": (
            "Get the list of colors the user has selected during this session, from most recent to oldest. "
            "Use this when the user asks about previously chosen colors, wants to return to an earlier color, "
            "or asks what colors they have tried. "
            "Describe colors using natural expressions or color names, not RGB values."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "SEARCH_COLOR",
        "description": (
            "Search the color database by name (partial match). "
            "Use this when the user asks about colors by name or requests to see color options "
            "(e.g., 'Pink 800', 'sky blue', '群青色', '青っぽい色'). "
            "Returns a list of matching colors with exact RGB values."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Color name to search for (partial match, e.g. 'Pink 800', 'sky blue', '群青', '青').",
                }
            },
            "required": ["query"],
        },
    },
]

# These tools send args as-is (empty or passthrough).
COMMANDS: dict[str, object] = {}

RULES_JA = """\
## GET_UI_STATE — 毎回最初に呼ぶこと

**ユーザーの発言ごとに、最初のアクションとして必ず GET_UI_STATE を呼ぶ。**
例外（tool call不要、会話のみ）：機能確認の質問（「何ができますか？」等）、単純な挨拶・世間話。

返り値から次の3点を判断してから応答する：

1. **何を言うか**
   - `color.shape` に合わせた説明・提案（例：shape=Lab なら知覚的均一性に触れる）。
   - `color.uiContext.colorSamples.japanese` が true なら日本の伝統色名を積極的に使う。
   - `color.uiContext.activeSlide` があれば、そのスライド内容に関連した説明を優先。
   - **既にアクティブな設定と同じ提案は絶対禁止**：`color.shape` が 'HSB' なら「HSBで見てみますか？」禁止（他shapeも同様）。`harmony` が 'complementary' なら「補色を表示しますか？」禁止（他harmonyも同様）。`colorSamples.japanese`/`.material` 等が true ならその表示提案も禁止。

2. **何を消すか**
   - `activeSlide` があり話題と無関係なら DISMISS_CONTENT で閉じる。関連があれば開いたままでよい。

3. **何を表示するか**
   - ユーザーの依頼に明らかに必要な場合のみ、カラーセット（SET_COLOR_SETS）・スライド（SHOW_CONTENT）・色空間（CHANGE_SHAPE）への切替を実行する。自分から提案はしない（提案はシステムから候補が届いたときだけ）。

---

- 色を選ぶ・変える依頼（「緑を選んで」「〜にして」）は、SEARCH_COLOR の結果が複数でも1色に決めて SELECT_COLOR（color_select の ① のルール）。
- 候補を見たいという依頼（「どんな青がある？」「青系の色を見せて」）は、SEARCH_COLOR の上位3〜5件を SHOW_COLOR_LABELS で3D空間に表示する（「どれにしますか？」と聞き返さない）。
- **漠然とした聞き返し（「どんな青がお好みですか？」等）は禁止**。
- **SEARCH_COLOR の query 言語**：日本の伝統色は name1 が漢字（例「桜色」）・name2 がひらがな。CSS・Material Design は name1 が英語（例「skyblue」）。色の種類に合わせてクエリ言語を選ぶ（「スカイブルー」→ query="sky blue"、「桜色」→ query="桜色"）。0件なら別言語や短いキーワードで再試行。
- 以前の色や履歴について聞かれたら GET_COLOR_HISTORY を呼ぶ。
- 「この色の名前は？」等には GET_CLOSEST_COLOR を呼ぶ（「背景は何色？」なら target="background"）。結果は色名＋所属コレクション（"tags"参照：JAPANESE→「日本の伝統色」、MATERIAL→「マテリアルデザインカラー」、CSS→「CSSカラー」）を必ず言う（例：「CSSカラーの Sky Blue に最も近いです。」）。RGB値・距離の数値は言わない。\
"""

RULES_EN = """\
## GET_UI_STATE — Call at the start of every interaction

**At the start of EVERY user interaction, call GET_UI_STATE as your very first action.**
Exceptions (no tool call, respond conversationally): capability questions ("What can you do?", etc.), simple greetings or small talk.

Use the returned data to make three decisions before generating your response:

1. **What to say**
   - Tailor explanation to `color.shape` (e.g. shape=Lab → naturally bring up perceptual uniformity).
   - If `color.uiContext.colorSamples.japanese` is true, actively use Japanese traditional color names.
   - If `color.uiContext.activeSlide` is set, prioritize explanations related to that slide's topic.
   - **Never suggest activating something already active**: `color.shape`='HSB' → no "want to view in HSB?" (same for other shapes). `harmony`='complementary' → no "want to see complementary colors?" (same for other modes). `colorSamples.japanese`/`.material` etc. true → no suggestion to show that set.

2. **What to dismiss**
   - If `activeSlide` is set and unrelated to the topic, call DISMISS_CONTENT. If still relevant, leave it open.

3. **What to show**
   - Only when clearly needed for the user's request: switch color set (SET_COLOR_SETS), slide (SHOW_CONTENT), or color space (CHANGE_SHAPE). Do not suggest them on your own (suggest only when the system sends candidates).

---

- A request to pick or change to a color ("pick green", "make it ...") → decide on ONE color and SELECT_COLOR, even when SEARCH_COLOR returns several (rule ① of color selection).
- A request to see options ("what blues are there?", "show me some blues") → SHOW_COLOR_LABELS with the top 3–5 SEARCH_COLOR results. Do NOT ask "which one?" first — just show them.
- **Never ask vague open-ended questions before acting.**
- **SEARCH_COLOR**: the database uses English names (e.g. "skyblue"). Always search in English. If 0 results, try a shorter/simpler keyword.
- If the user asks about previous colors or wants to go back, call GET_COLOR_HISTORY first.
- If asked what the current color is called or resembles, call GET_CLOSEST_COLOR (target="background" when asked about the background). Always mention both the color name AND its collection (from "tags"): JAPANESE → "Japanese traditional color", MATERIAL → "Material Design color", CSS → "CSS color" (e.g. "This is Sky Blue, a CSS color."). Never mention RGB values or distance numbers.\
"""
