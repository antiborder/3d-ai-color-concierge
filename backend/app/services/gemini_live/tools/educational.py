"""SHOW_CONTENT — 色彩理論の教育コンテンツを表示するツール。

表示可能なスライドと、スライド間のつながり（次に何を勧めるか）は
app/data/topic_graph.json で定義する。
"""

from __future__ import annotations

from app.services.navigation import NavState, content_ids, load_topic_graph
from app.services.prompts.topics import topic_script

CONTENT_IDS = content_ids()

DECLARATIONS: list[dict] = [
    {
        "name": "SHOW_CONTENT",
        "description": (
            "Display an educational slide about a color theory topic. "
            "Call it at the START of your response, before speaking. "
            "The response contains the speaking script and next_suggestions — follow the SHOW_CONTENT rules. "
            "Do NOT call SELECT_COLOR or other action tools in the same response."
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
    {
        "name": "RECORD_DECLINE",
        "description": (
            "Record that the user declined a topic you suggested from next_suggestions, "
            "so it is not suggested again. Call silently."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "enum": CONTENT_IDS,
                    "description": "Content ID of the declined suggestion.",
                }
            },
            "required": ["id"],
        },
    },
]


def _show_content(args: dict) -> dict:
    return {"id": args.get("id")}


COMMANDS: dict[str, object] = {
    "SHOW_CONTENT": _show_content,
    "DISMISS_CONTENT": lambda _args: {},
}


def build_show_content_response(content_id: str, nav_state: NavState, language: str) -> dict:
    """SHOW_CONTENT の tool response。発話スクリプトと次トピックの候補を Gemini に渡す。"""
    graph = load_topic_graph()
    if content_id not in graph.nodes:
        return {"result": "error", "error": f"Unknown content id: {content_id}"}
    nav_state.mark_shown(content_id)
    return {
        "result": "ok",
        "title": graph.label(content_id, language),
        "script": topic_script(content_id, language),
        "next_suggestions": nav_state.next_suggestions(language, graph),
    }


RULES_JA = """\
## SHOW_CONTENT — スライド表示ルール

表示できるのは id の enum にあるスライドのみ。

**呼ぶタイミング**:
1. enum のトピックについて明示的に質問された → 即座に SHOW_CONTENT を呼ぶ。
2. あなたが提案したトピックにユーザーが同意した → 次のターンでその id で呼ぶ。
3. 会話で enum のトピックに自然に触れた → 2回に1回程度、口頭で提案してよい。

**呼び方**: 「表示します」「見てみましょう」等は言わない。まず SHOW_CONTENT を呼び、tool response を受けてから話す。CHANGE_SHAPE と同じレスポンスで呼んでよいが、SELECT_COLOR は呼ばない。

**tool response に従って、1回の連続した発話で話す**:
- script がある → s1 を言い、s2 が null でなければ続けて言う。
- script が null → スライドはタイトルのみ。そのトピックを自分の知識で2文以内で説明する。
- next_suggestions が空でない → 最後に1つだけ選び、その phrase をほぼそのまま言う（つなぎ言葉の調整のみ可）。会話の流れに最も合うものを選び、迷ったら先頭。ユーザーが色選びなどに集中していて提案が不自然なら言わない。
- next_suggestions が空 → 他のトピックを自分から勧めない。

**提案への返答**: 同意 → その id で SHOW_CONTENT。断られた → RECORD_DECLINE(id) を黙って呼ぶ（「記録します」等は言わない）。

## DISMISS_CONTENT

GET_UI_STATE で activeSlide が null 以外かつ話題と無関係なら呼ぶ。「閉じます」等の言及は不要。\
"""

RULES_EN = """\
## SHOW_CONTENT — Slide display rules

Only slides in the id enum exist.

**When to call:**
1. The user explicitly asks about a topic in the enum → call SHOW_CONTENT immediately.
2. The user agrees to a topic you suggested → call it with that id in the next turn.
3. The conversation naturally touches on a topic in the enum → offer it verbally about half the time.

**How to call:** do NOT say "let me show you a slide". Call SHOW_CONTENT first and speak after the tool response arrives. May be called together with CHANGE_SHAPE. Do NOT call SELECT_COLOR.

**Follow the tool response, as one continuous utterance:**
- script present → say s1, then s2 if it is not null.
- script is null → the slide shows only a title. Explain the topic in at most 2 sentences from your own knowledge.
- next_suggestions non-empty → end by choosing ONE and saying its phrase nearly verbatim (only adjust connecting words). Pick the one that best fits the conversation; if unsure, the first. Skip it if the user is focused on something else (e.g. picking colors).
- next_suggestions empty → do not suggest other topics on your own.

**Replies to a suggestion:** agreed → SHOW_CONTENT with that id. Declined → call RECORD_DECLINE(id) silently (do not mention it).

## DISMISS_CONTENT

Call when GET_UI_STATE returns a non-null activeSlide unrelated to the current topic. Do not verbally mention closing it.\
"""
