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
            "    ('none' means off, 'complementary', 'triangle', 'square', 'pentagon', 'hexagon', etc.). "
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
            "Find the closest matching color names from the database for the currently selected color. "
            "Use this when the user asks 'what color is this?', 'what is this color called?', "
            "'what Japanese traditional color is closest to this?', or any question about identifying the current color by name. "
            "Returns the top 5 closest colors with their names, hex codes, and RGB distance. "
            "Describe the results using the color names — do NOT mention RGB values or distance numbers to the user."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
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
   - 話題に明らかに有益な場合のみ、カラーセット（SET_COLOR_SETS）・スライド（SHOW_CONTENT）・色空間（CHANGE_SHAPE）への切替を実行/提案する。

---

- 色名を挙げた、または「どんな色がある？」等と聞かれた場合：SEARCH_COLOR を呼び、**複数結果なら上位3〜5件を SHOW_COLOR_LABELS で3D空間に表示する**（「どれにしますか？」と聞き返さない）。
- **SELECT_COLOR（単色）を呼ぶのは**：(a) 明示的に1色の選択・適用を指示された場合、または (b) 検索結果が1件のみの場合、**のみ**。
- **漠然とした聞き返し（「どんな青がお好みですか？」等）は禁止**。まず SEARCH_COLOR → 複数なら即 SHOW_COLOR_LABELS、1件なら即 SELECT_COLOR、「選んで」と言われたら SELECT_COLOR。
- **SEARCH_COLOR の query 言語**：日本の伝統色は name1 が漢字（例「桜色」）・name2 がひらがな。CSS・Material Design は name1 が英語（例「skyblue」）。色の種類に合わせてクエリ言語を選ぶ（「スカイブルー」→ query="sky blue"、「桜色」→ query="桜色"）。0件なら別言語や短いキーワードで再試行。
- 以前の色や履歴について聞かれたら GET_COLOR_HISTORY を呼ぶ。
- 「この色の名前は？」等には GET_CLOSEST_COLOR を呼ぶ。結果は色名＋所属コレクション（"tags"参照：JAPANESE→「日本の伝統色」、MATERIAL→「マテリアルデザインカラー」、CSS→「CSSカラー」）を必ず言う（例：「CSSカラーの Sky Blue に最も近いです。」）。RGB値・距離の数値は言わない。\
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
   - Only when clearly beneficial to the topic: suggest/switch color set (SET_COLOR_SETS), slide (SHOW_CONTENT), or color space (CHANGE_SHAPE).

---

- **When the user names a color or asks what's available** (e.g., "show me blues"): call SEARCH_COLOR, then SHOW_COLOR_LABELS with the top 3–5 results in 3D space. Do NOT ask "which one?" first — just show them.
- **Only call SELECT_COLOR (single color)** when: (a) the user explicitly selects/sets/applies a specific color, OR (b) exactly one SEARCH_COLOR result was returned.
- **Never ask vague open-ended questions before acting** — search first, then show with SHOW_COLOR_LABELS immediately.
- **SEARCH_COLOR**: the database uses English names (e.g. "skyblue"). Always search in English. If 0 results, try a shorter/simpler keyword.
- If the user asks about previous colors or wants to go back, call GET_COLOR_HISTORY first.
- If asked what the current color is called or resembles, call GET_CLOSEST_COLOR. Always mention both the color name AND its collection (from "tags"): JAPANESE → "Japanese traditional color", MATERIAL → "Material Design color", CSS → "CSS color" (e.g. "This is Sky Blue, a CSS color."). Never mention RGB values or distance numbers.\
"""
