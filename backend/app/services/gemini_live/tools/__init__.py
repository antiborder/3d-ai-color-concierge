"""gemini_live.tools パッケージ — 後方互換のパブリック API。"""

from __future__ import annotations

from typing import Any

from . import (
    color_adjust,
    color_bridge,
    color_harmony,
    color_labels,
    color_query,
    color_select,
    color_sets,
    color_space,
    educational,
    hex_copy,
)

# ── ツール宣言（Gemini Live API に渡す function_declarations）─────────────
_TOOL_MODULES = [
    color_select,
    color_adjust,
    color_space,
    color_query,
    hex_copy,
    color_harmony,
    color_sets,
    color_bridge,
    color_labels,
    educational,
]

# ── フロントエンドコマンド変換ディスパッチテーブル ─────────────────────────
_COMMANDS: dict[str, Any] = {}
for _mod in _TOOL_MODULES:
    _COMMANDS.update(_mod.COMMANDS)  # type: ignore[attr-defined]


def live_tools() -> list[dict]:
    declarations = []
    for mod in _TOOL_MODULES:
        declarations.extend(mod.DECLARATIONS)  # type: ignore[attr-defined]
    return [{"function_declarations": declarations}]


def tool_call_to_frontend_command(name: str, args: dict) -> dict:
    handler = _COMMANDS.get(name)
    if handler is not None:
        return {"action": name, "parameters": handler(args)}
    return {"action": name, "parameters": args}


def tool_call_function_calls(tool_call: Any) -> list:
    """tool_call から function_calls を取り出す（SDK差分を吸収）。"""
    if tool_call is None:
        return []
    function_calls = getattr(tool_call, "function_calls", None) or getattr(
        tool_call, "functionCalls", None
    )
    if function_calls is None and isinstance(tool_call, dict):
        function_calls = tool_call.get("function_calls") or tool_call.get("functionCalls")
    if not function_calls:
        return []
    try:
        return list(function_calls)
    except Exception:
        return []


def live_system_instruction(language: str) -> dict:
    from app.services.prompts.live_system import build_live_system_instruction

    return build_live_system_instruction(language)
