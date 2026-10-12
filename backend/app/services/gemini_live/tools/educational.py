"""SHOW_CONTENT — 色彩理論の教育コンテンツを表示するツール。あわせて、次に何を勧めるか。

表示可能なスライドと、スライド間のつながりは app/data/topic_graph.json、
トピック外の操作（明るくする、補色を表示する等）とそのつながりは app/data/action_graph.json で定義する。
"""

from __future__ import annotations

from app.services.gemini_live.tools.color_space import COLOR_SPACES
from app.services.navigation import NavState, content_ids, load_topic_graph
from app.services.navigation.action_graph import load_action_graph
from app.services.navigation.recommender import choose, suggest, tags_for
from app.services.prompts.topics import topic_script

CONTENT_IDS = content_ids()
# 提案を受け入れられたら RUN_SUGGESTION で実行する操作
ACTION_IDS = load_action_graph().runnable_ids()

DECLARATIONS: list[dict] = [
    {
        "name": "SHOW_CONTENT",
        "description": (
            "Display an educational slide about a color theory topic. "
            "Call it at the START of your response, before speaking. "
            "The response contains the speaking script — follow the SHOW_CONTENT rules. "
            "Do NOT call SELECT_COLOR or other action tools in the same response."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "enum": CONTENT_IDS,
                    "description": "Educational content ID to display.",
                },
                "colorSpace": {
                    "type": "string",
                    "enum": COLOR_SPACES,
                    "description": (
                        "Optional. Also switch the 3D color space (same values as CHANGE_SHAPE). "
                        "The view deforms first, then the slide appears."
                    ),
                },
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
            "Record that the user declined a candidate you suggested (a slide or an action), "
            "so it is not suggested again. Call silently."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "enum": [*CONTENT_IDS, *load_action_graph().action_ids],
                    "description": "ID of the declined suggestion.",
                }
            },
            "required": ["id"],
        },
    },
    {
        "name": "RUN_SUGGESTION",
        "description": (
            "Carry out an action you suggested (an id starting with 'act_') after the user "
            "agreed to it. The app performs it; then report the result in one short sentence, "
            "following the response."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "enum": ACTION_IDS,
                    "description": "ID of the suggested action the user agreed to.",
                }
            },
            "required": ["id"],
        },
    },
]


def _show_content(args: dict) -> dict:
    params = {"id": args.get("id")}
    if args.get("colorSpace"):
        params["colorSpace"] = args["colorSpace"]
    return params


COMMANDS: dict[str, object] = {
    "SHOW_CONTENT": _show_content,
    "DISMISS_CONTENT": lambda _args: {},
}


def build_show_content_response(
    content_id: str, nav_state: NavState, language: str, ui: dict | None = None
) -> dict:
    """SHOW_CONTENT の tool response。発話スクリプトを Gemini に渡し、次の候補を保留する。"""
    graph = load_topic_graph()
    if content_id not in graph.nodes:
        return {"result": "error", "error": f"Unknown content id: {content_id}"}
    nav_state.mark_shown(content_id)
    # The next suggestion is not part of this response: it is held and given to Gemini as
    # its own turn after the narration has finished playing, so there is a pause between them.
    candidates = suggest(content_id, nav_state, language, ui or {}, graph)
    held = choose(candidates, nav_state.rng)
    nav_state.hold_suggestions(held)
    # The same recommendations, as tags under the slide (the spoken one first)
    nav_state.slide_tags = tags_for(held, candidates)
    return {
        "result": "ok",
        "title": graph.label(content_id, language),
        "script": topic_script(content_id, language),
        # Without this the model sometimes ends the script with a suggestion of its own (e.g. "shall
        # I adjust the brightness?"), right before the held suggestion arrives. It follows the
        # tool response more closely than the rules, so the instruction is repeated here.
        "next_step": NEXT_STEP,
    }


NEXT_STEP = (
    "Say the script, then stop. Do NOT add any suggestion or question of your own "
    "(no other topics, no color adjustments)."
)


def _on_accept(s: dict, language: str) -> str:
    """候補が受け入れられたときに呼ぶ tool（Gemini が取り違えないよう候補ごとに明示する）。"""
    if s["id"] == "act_ask_preference":
        return "答えに合わせて会話を続ける" if language == "ja" else "continue from their answer"
    tool = "RUN_SUGGESTION" if s["kind"] == "action" else "SHOW_CONTENT"
    return f'{tool}(id="{s["id"]}")'


def build_suggestion_prompt(suggestions: list[dict], language: str) -> str:
    """説明や操作の報告のあと、間を置いて次を提案させるための指示（ユーザー発言ではない）。

    何を勧めるかはコードが決めている（recommender.choose）ので、Gemini には1件だけ渡して言わせる。
    """
    s = suggestions[0]
    if language == "ja":
        return (
            "（システムからの指示です。ユーザーの発言ではありません）"
            "あなたの発話は終わりました。次の「」内の文を、ほぼそのまま1文で言ってください。"
            "直前の説明や報告を繰り返したり、ほかの提案を足したり、今ツールを呼んだりしないでください。"
            f"\n「{s['phrase']}」\n"
            f"ユーザーが同意したら：{_on_accept(s, language)}（別のツールで代わりに行わない）"
        )
    return (
        "(System instruction, not said by the user) "
        "You have finished speaking. Say the quoted sentence below nearly verbatim, in one sentence. "
        "Do not repeat what you just said, do not add other suggestions, and do not call any tool now."
        f'\n"{s["phrase"]}"\n'
        f"If the user agrees: {_on_accept(s, language)} (do not use a different tool instead)"
    )


def build_tag_prompt(node_id: str, language: str) -> str | None:
    """スライド下のおすすめタグが押されたとき、Gemini にそれを行わせる指示。未知の id なら None。"""
    graph = load_topic_graph()
    actions = load_action_graph()
    if node_id in graph.nodes:
        name, call = graph.label(node_id, language), f'SHOW_CONTENT(id="{node_id}")'
    elif node_id in actions.runnable_ids():
        name = actions.actions[node_id]["label"][language]
        call = f'RUN_SUGGESTION(id="{node_id}")'
    else:
        return None
    if language == "ja":
        return (
            "（システムからの指示です。ユーザーの発言ではありません）"
            f"ユーザーが画面のおすすめタグ「{name}」を押しました。"
            f"前置きを言わずに、すぐ {call} を呼び、tool response に従って話してください。"
        )
    return (
        "(System instruction, not said by the user) "
        f'The user pressed the recommendation tag "{name}" on screen. '
        f"Without any preamble, call {call} right away and speak as the tool response says."
    )


RULES_JA = """\
## SHOW_CONTENT — スライド表示ルール

表示できるのは id の enum にあるスライドのみ。加法混色の質問は rgb_primary（光の三原色）、減法混色の質問は cmy_primary（色材の三原色）で説明する。

**呼ぶタイミング**:
1. enum のトピックについて明示的に質問された → 即座に SHOW_CONTENT を呼ぶ。
2. あなたが提案したトピックにユーザーが同意した → 次のターンでその id で呼ぶ。

**呼び方**: 「表示します」「見てみましょう」等は言わない。まず SHOW_CONTENT を呼び、tool response を受けてから話す。色空間も切り替えるときは CHANGE_SHAPE を別に呼ばず colorSpace に指定する。SELECT_COLOR は呼ばない。

**tool response に従って、1回の連続した発話で話す**:
- script がある → s1 を言い、s2 が null でなければ続けて言う。
- script が null → スライドはタイトルのみ。そのトピックを自分の知識で2文以内で説明する。
- この発話では次を勧めない。説明を言い終えて少し間を置いたあと、システムから候補が届いたら、その指示に従って1文で提案する。

## 提案（スライド・操作）

- **自分から次のスライドや操作を提案しない。** スライドの説明や操作の後には、システムが候補を届ける。提案するのは、その候補が届いたときだけ（候補の phrase を1文で言う）。
- **提案への返答**:
  - 同意された → id が act_ で始まらなければ SHOW_CONTENT(id)、act_ で始まれば RUN_SUGGESTION(id)。RUN_SUGGESTION の後は、tool response に従って結果を1文で伝える（instruction があればそれに従う）。
  - act_ask_preference（好みを聞く質問）に答えが返ってきた → 答えに合わせて会話を続ける（RUN_SUGGESTION は呼ばない）。
  - 断られた → RECORD_DECLINE(id) を黙って呼ぶ（「記録します」等は言わない）。

## DISMISS_CONTENT

GET_UI_STATE で activeSlide が null 以外かつ話題と無関係なら呼ぶ。「閉じます」等の言及は不要。\
"""

RULES_EN = """\
## SHOW_CONTENT — Slide display rules

Only slides in the id enum exist. For additive color mixing use rgb_primary (primary colors of light); for subtractive mixing use cmy_primary (primary colors of pigment).

**When to call:**
1. The user explicitly asks about a topic in the enum → call SHOW_CONTENT immediately.
2. The user agrees to a topic you suggested → call it with that id in the next turn.

**How to call:** do NOT say "let me show you a slide". Call SHOW_CONTENT first and speak after the tool response arrives. To also switch the color space, pass colorSpace instead of calling CHANGE_SHAPE separately. Do NOT call SELECT_COLOR.

**Follow the tool response, as one continuous utterance:**
- script present → say s1, then s2 if it is not null.
- script is null → the slide shows only a title. Explain the topic in at most 2 sentences from your own knowledge.
- Do not suggest anything next in this utterance. After you finish and a short pause, the system sends candidates; then follow that instruction and suggest one in a single sentence.

## Suggestions (slides and actions)

- **Never suggest a next slide or action on your own.** After a slide's narration or an action, the system sends candidates. Suggest only when they arrive (say a candidate's phrase in one sentence).
- **Replies to a suggestion:**
  - Agreed → if the id does not start with act_, SHOW_CONTENT(id); if it does, RUN_SUGGESTION(id). After RUN_SUGGESTION, report the result in one sentence as the tool response says (follow its instruction if there is one).
  - The user answers act_ask_preference (a question about their mood) → continue the conversation from their answer (do not call RUN_SUGGESTION).
  - Declined → call RECORD_DECLINE(id) silently (do not mention it).

## DISMISS_CONTENT

Call when GET_UI_STATE returns a non-null activeSlide unrelated to the current topic. Do not verbally mention closing it.\
"""
