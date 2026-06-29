"""GET_CURRENT_COLOR / GET_CLOSEST_COLOR / GET_COLOR_HISTORY / SEARCH_COLOR — 色情報クエリツール群。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "GET_CURRENT_COLOR",
        "description": (
            "Get the current selected color state (latest snapshot from the UI). "
            "When responding to users about the current color, describe it using color names or natural expressions only. "
            "NEVER mention RGB values or numeric values like 255,79,24."
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
            "Use this BEFORE SELECT_COLOR when the user mentions a color by name "
            "(e.g., 'Pink 800', 'sky blue', '群青色', '青っぽい色'). "
            "Returns a list of matching colors with exact RGB values. "
            "If multiple results are returned, present the options to the user and ask which one they want, "
            "then call SELECT_COLOR with the chosen color's RGB values. "
            "If one result is returned, call SELECT_COLOR immediately with that color's RGB values."
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
- ユーザーが「今の色は？」「現在のRGBを教えて」など現在色の確認を求めた場合は、必ず最初に GET_CURRENT_COLOR を tool call してください。
- **ユーザーが「どんな色がある？」「見せて」と聞いた場合**（例：「青っぽい色にはどんな色がありますか？」「ピンク系を教えて」）：SEARCH_COLOR を呼び出し、結果から最大5件の色名を提示して「どれにしますか？」と聞いてから SELECT_COLOR を呼び出してください。
- **「どんな青がお好みですか？」のような漠然とした質問を先にするのは禁止**。まず SEARCH_COLOR で検索し、「選んで」なら即実行、「見せて」なら選択肢提示、という判断をしてください。
- **SEARCH_COLOR の query 言語について**：色データベースは色の種類によって言語が異なります。日本の伝統色は name1 が漢字（例：「桜色」「群青色」）、name2 がひらがな。CSS・Material Design の色は name1 が英語（例：「skyblue」「Pink 800」）。クエリ言語を色の種類に合わせてください。「スカイブルー」→ query="sky blue"（英語）、「桜色」→ query="桜色"（日本語）。0件だった場合は別の言語や短いキーワードで再試行してください。
- ユーザーが以前選んだ色について聞いたり、前の色に戻りたいと言ったり、どんな色を試したか聞いた場合は、GET_COLOR_HISTORY を呼び出してください。
- ユーザーが「この色の名前は？」「この色に近い日本の伝統色は？」「何色に近い？」と聞いた場合は GET_CLOSEST_COLOR を呼び出してください。結果を伝える際は色名とともに所属コレクション名も必ず言ってください（"tags" フィールドを参照）：JAPANESE →「日本の伝統色」、MATERIAL →「マテリアルデザインカラー」、CSS →「CSSカラー」。例：「CSSカラーの Sky Blue に最も近いです。」「日本の伝統色の紅紫（べにむらさき）に最も近いです。」RGB値や距離の数値はユーザーに言わないでください。\
"""

RULES_EN = """\
- If the user asks what the current color is (e.g. "What is the current RGB?"), you MUST call GET_CURRENT_COLOR first.
- **When the user asks what colors are available** (e.g., "what kinds of blue are there?", "show me options for pink"): call SEARCH_COLOR, then present up to 5 concrete color names and ask which one they want before calling SELECT_COLOR.
- **Never ask vague open-ended questions like "What kind of blue do you prefer?" before acting** — search first, then either pick immediately (if user said "select") or present options (if user asked "what's available").
- **For SEARCH_COLOR**: The color database uses English names (e.g. "skyblue", "Pink 800"). Always search in English. If 0 results are returned, try a shorter or simpler keyword (e.g. "blue" instead of "sky blue").
- If the user asks about colors they have tried before, wants to go back to a previous color, or asks what colors they explored, call GET_COLOR_HISTORY first.
- If the user asks what the current color is called, what color name is closest, or what Japanese traditional color this resembles, call GET_CLOSEST_COLOR. When describing results, always mention both the color name AND its collection (from the "tags" field): JAPANESE → "Japanese traditional color", MATERIAL → "Material Design color", CSS → "CSS color". Examples: "This is Sky Blue, a CSS color." / "The closest is Benimurasaki (紅紫), a Japanese traditional color." Never mention RGB values or distance numbers.\
"""
