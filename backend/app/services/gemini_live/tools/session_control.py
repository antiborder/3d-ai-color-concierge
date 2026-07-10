"""DISABLE_CHAT — ユーザーの要求によりchatセッションを終了するツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "DISABLE_CHAT",
        "description": (
            "Disable the chat session when the user explicitly asks the AI to stop talking. "
            "Use this ONLY when the user says things like 'shut up', 'be quiet', 'stop talking', "
            "'黙ってて', 'うるさい', 'しゃべらないで', 'Can you be quiet?' etc. "
            "Before calling this tool, say one short farewell sentence aloud."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
        },
    }
]


def _disable_chat(args: dict) -> dict:
    return {}


COMMANDS: dict[str, object] = {
    "DISABLE_CHAT": _disable_chat,
}

RULES_JA = """\
## DISABLE_CHAT（chat機能オフ）
- ユーザーが「黙ってて」「うるさい」「静かにして」「しゃべらないで」「会話を終了して」など、AIの発話停止を求める発言をした場合：
  1. **まず「chat機能をオフにします。」と音声で述べること。**
  2. **その直後に DISABLE_CHAT を呼び出すこと。**
  3. tool call の後は一切発話しないこと。\
"""

RULES_EN = """\
## DISABLE_CHAT (turn off chat)
- When the user says "shut up", "be quiet", "can you be quiet?", "stop talking", "silence", "go quiet", etc.:
  1. **First say "Turning off chat." aloud.**
  2. **Then immediately call DISABLE_CHAT.**
  3. Do NOT say anything after the tool call.\
"""
