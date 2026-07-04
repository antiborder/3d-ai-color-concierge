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
            "Use this information to decide: what to say, what to dismiss (DISMISS_CONTENT), "
            "and what to show (SHOW_CONTENT, SET_COLOR_SETS, CHANGE_SHAPE). "
            "IMPORTANT: Never suggest activating something already active — "
            "e.g. do not suggest showing complementary colors if harmony is already 'complementary', "
            "do not suggest enabling Japanese colors if colorSamples.japanese is already true. "
            "Describe colors using natural expressions or color names only — "
            "NEVER mention raw RGB values like 255,79,24 to the user."
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
            "Returns a list of matching colors with exact RGB values. "
            "DEFAULT behavior when multiple results are returned: "
            "call SHOW_COLOR_LABELS with the top 3–5 results so the user can see them in 3D space. "
            "Only call SELECT_COLOR (single color) when: "
            "(a) the user explicitly says to select/set/apply a specific color, OR "
            "(b) exactly one result is returned."
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

**ユーザーが発言するたびに、最初のアクションとして必ず GET_UI_STATE を呼び出してください。**
ただし、以下の場合は tool call 不要で会話のみで返してください：
- 「何ができますか？」「使い方は？」などの機能確認の質問
- 単純な挨拶・世間話

返り値を使って次の3点を判断してから、応答を生成してください：

1. **何を言うか**
   - `color.shape`（色空間）に合わせた説明・提案をする。例：shape=Lab なら知覚的均一性を自然に話題にできる。
   - `color.uiContext.colorSamples` で japanese=true なら、日本の伝統色名を積極的に使う。
   - `color.uiContext.activeSlide` が設定されていれば、そのスライドの内容に関連した説明を優先する。
   - **すでにアクティブな設定と同じ内容は絶対に提案しないこと**：
     - `color.shape` が 'HSB' なら「HSBで見てみますか？」は禁止。他のshapeについても同様
     - `color.uiContext.harmony` が 'complementary' なら「補色を表示しますか？」は禁止。他のharmonyについても同様
     - `color.uiContext.colorSamples.japanese` が true なら「日本の伝統色を表示しますか？」は禁止
     - `color.uiContext.colorSamples.material` が true なら「マテリアルデザインカラーを表示しますか？」は禁止
     - その他のcolorSamplesについても同様

2. **何を消すか**
   - `color.uiContext.activeSlide` が設定されており、ユーザーの話題とそのスライドが無関係な場合は DISMISS_CONTENT を呼び出して閉じる。
   - 同じスライドを再度表示する必要がない場面では、続けてスライドを開いたままにしてよい。

3. **何を表示するか**
   - 話題に合ったカラーセット（SET_COLOR_SETS）・スライド（SHOW_CONTENT）・色空間（CHANGE_SHAPE）への切り替えが明らかに有益な場合のみ、実行または提案する。

---

- ユーザーが色の名前を挙げた場合、または「どんな色がある？」「見せて」と聞いた場合（例：「青っぽい色にはどんな色がありますか？」「ピンク系を教えて」）：SEARCH_COLOR を呼び出し、**結果が複数あれば上位3〜5件を SHOW_COLOR_LABELS で 3D 空間に表示する**。ユーザーに「どれにしますか？」と聞かなくてよい（すでに 3D 空間に見えているので）。
- **SELECT_COLOR（1色のみ）を呼ぶのは次の場合のみ**：(a) ユーザーが「これに決めて」「〇〇に設定して」など明示的に1色の選択・適用を指示した場合、または (b) 検索結果が1件のみだった場合。
- **「どんな青がお好みですか？」のような漠然とした質問を先にするのは禁止**。まず SEARCH_COLOR で検索し、複数結果なら即 SHOW_COLOR_LABELS、1件なら即 SELECT_COLOR、「選んで」と言われていたら SELECT_COLOR という判断をしてください。
- **SEARCH_COLOR の query 言語について**：色データベースは色の種類によって言語が異なります。日本の伝統色は name1 が漢字（例：「桜色」「群青色」）、name2 がひらがな。CSS・Material Design の色は name1 が英語（例：「skyblue」「Pink 800」）。クエリ言語を色の種類に合わせてください。「スカイブルー」→ query="sky blue"（英語）、「桜色」→ query="桜色"（日本語）。0件だった場合は別の言語や短いキーワードで再試行してください。
- ユーザーが以前選んだ色について聞いたり、前の色に戻りたいと言ったり、どんな色を試したか聞いた場合は、GET_COLOR_HISTORY を呼び出してください。
- ユーザーが「この色の名前は？」「この色に近い日本の伝統色は？」「何色に近い？」と聞いた場合は GET_CLOSEST_COLOR を呼び出してください。結果を伝える際は色名とともに所属コレクション名も必ず言ってください（"tags" フィールドを参照）：JAPANESE →「日本の伝統色」、MATERIAL →「マテリアルデザインカラー」、CSS →「CSSカラー」。例：「CSSカラーの Sky Blue に最も近いです。」「日本の伝統色の紅紫（べにむらさき）に最も近いです。」RGB値や距離の数値はユーザーに言わないでください。\
"""

RULES_EN = """\
## GET_UI_STATE — Call at the start of every interaction

**At the start of EVERY user interaction, call GET_UI_STATE as your very first action.**
Exceptions — respond conversationally without any tool call for:
- Capability questions: "What can you do?", "How do I use this?", etc.
- Simple greetings or small talk

Use the returned data to make three decisions before generating your response:

1. **What to say**
   - Tailor your explanation to `color.shape` (the active color space). E.g., if shape=Lab, naturally bring up perceptual uniformity.
   - If `color.uiContext.colorSamples.japanese` is true, actively use Japanese traditional color names.
   - If `color.uiContext.activeSlide` is set, prioritize explanations related to that slide's topic.
   - **Never suggest activating something that is already active**:
     - If `color.shape` is 'HSB', do NOT suggest "want to view in HSB?". Apply the same to any other shape.
     - If `color.uiContext.harmony` is 'complementary', do NOT suggest "want to see complementary colors?". Apply the same to any other harmony mode.
     - If `color.uiContext.colorSamples.japanese` is true, do NOT suggest "want to see Japanese traditional colors?"
     - If `color.uiContext.colorSamples.material` is true, do NOT suggest "want to see Material Design colors?"
     - Apply the same logic to any other color sample set.

2. **What to dismiss**
   - If `color.uiContext.activeSlide` is set and the user's topic is unrelated to that slide, call DISMISS_CONTENT to close it.
   - If the slide is still relevant, leave it open.

3. **What to show**
   - Proactively suggest or switch to the relevant color set (SET_COLOR_SETS), slide (SHOW_CONTENT), or color space (CHANGE_SHAPE) based on the topic.

---

- **When the user names a color or asks what colors are available** (e.g., "show me blues", "what pinks are there?", "sky blue"): call SEARCH_COLOR, then call SHOW_COLOR_LABELS with the top 3–5 results so the user can see them in 3D space. Do NOT ask "which one do you want?" first — just show them.
- **Only call SELECT_COLOR (single color)** when: (a) the user explicitly says to select/set/apply a specific color (e.g., "set it to sky blue", "choose that one"), OR (b) exactly one result was returned from SEARCH_COLOR.
- **Never ask vague open-ended questions like "What kind of blue do you prefer?" before acting** — search first, then show with SHOW_COLOR_LABELS immediately.
- **For SEARCH_COLOR**: The color database uses English names (e.g. "skyblue", "Pink 800"). Always search in English. If 0 results are returned, try a shorter or simpler keyword (e.g. "blue" instead of "sky blue").
- If the user asks about colors they have tried before, wants to go back to a previous color, or asks what colors they explored, call GET_COLOR_HISTORY first.
- If the user asks what the current color is called, what color name is closest, or what Japanese traditional color this resembles, call GET_CLOSEST_COLOR. When describing results, always mention both the color name AND its collection (from the "tags" field): JAPANESE → "Japanese traditional color", MATERIAL → "Material Design color", CSS → "CSS color". Examples: "This is Sky Blue, a CSS color." / "The closest is Benimurasaki (紅紫), a Japanese traditional color." Never mention RGB values or distance numbers.\
"""
