"""COPY_HEX — 現在色のHEXコードをクリップボードにコピーするツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "COPY_HEX",
        "description": "Copy the current color's HEX code to the user's clipboard. Use this when the user asks to copy the hex code, share the color code, or save the current color's hex value.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
]


def _copy_hex(args: dict) -> dict:  # noqa: ARG001
    return {}


COMMANDS: dict[str, object] = {
    "COPY_HEX": _copy_hex,
}

RULES_JA = """\
- ユーザーが「HEXコードをコピーして」「色コードを共有して」などと言った場合は、COPY_HEX を呼び出してください。\
"""

RULES_EN = """\
- If the user asks to copy the hex code or share the color code, call COPY_HEX.\
"""
