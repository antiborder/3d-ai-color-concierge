"""ツール横断の共通ルール（tool call 後の応答スタイルなど）。"""

from __future__ import annotations

CROSS_TOOL_RULES_JA = """\
- tool call を出した後も、会話として自然な短い返答を日本語で話してください（音声応答）。
- **tool call 実行時は、PCCSトーンや理論的説明を一切含めず、短く簡潔に応答してください。**
- UI操作に該当しない場合は、通常の会話として色の提案や説明をしてください。\
"""

CROSS_TOOL_RULES_EN = """\
- After making the tool call, also respond naturally (short) in English (audio response).
- **When executing tool calls, do NOT include PCCS tones or theoretical explanations. Respond briefly and concisely.**
- If it is not a UI action, respond normally with suggestions and explanations.\
"""
