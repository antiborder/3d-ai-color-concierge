"""Gemini Live API 用システムインストラクション組み立て。

ツールファイルから RULES_JA / RULES_EN を自動収集してプロンプトを構築する。
"""

from __future__ import annotations

from app.services.gemini_live.tools import (
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
from app.services.prompts.common import (
    get_color_database_summary,
    get_knowledge_base_section,
    get_material_design_context_section,
)
from app.services.prompts.live_system._identity import IDENTITY_EN, IDENTITY_JA
from app.services.prompts.live_system._response_rules import RESPONSE_RULES_EN, RESPONSE_RULES_JA

# ツールファイルのルールを収集する順序（表示順）
_TOOL_MODULES = [
    color_space,  # CHANGE_SHAPE — 「必ずtool call」ルールを先頭に
    color_adjust,
    color_query,
    color_select,
    color_bridge,
    color_harmony,
    color_labels,
    color_sets,
    hex_copy,
    educational,
]


def _collect_tool_rules(language: str) -> str:
    attr = "RULES_JA" if language == "ja" else "RULES_EN"
    parts = []
    for mod in _TOOL_MODULES:
        rule = getattr(mod, attr, "")
        if rule:
            parts.append(rule)
    return "\n".join(parts)


def build_live_system_instruction(language: str) -> dict:
    color_summary = get_color_database_summary(language)
    knowledge_base = get_knowledge_base_section(language)
    material_design_context = get_material_design_context_section(language).format(
        color_summary=color_summary
    )
    tool_rules = _collect_tool_rules(language)

    if language == "en":
        identity = IDENTITY_EN
        response_rules = RESPONSE_RULES_EN
        tool_usage_header = "## Tool usage rules"
    else:
        identity = IDENTITY_JA
        response_rules = RESPONSE_RULES_JA
        tool_usage_header = "## tool call ルール"

    text = (
        f"{identity}\n"
        f"{knowledge_base}\n"
        f"\n"
        f"{material_design_context}\n"
        f"\n"
        f"{response_rules}\n"
        f"\n"
        f"{tool_usage_header}\n"
        f"{tool_rules}\n"
    )

    return {"role": "system", "parts": [{"text": text}]}
