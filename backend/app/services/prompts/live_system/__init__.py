"""Gemini Live API 用システムインストラクション組み立て。

ツールファイルから RULES_JA / RULES_EN を自動収集してプロンプトを構築する。
"""

from __future__ import annotations

from app.services.gemini_live.tools import (
    color_adjust,
    color_bridge,
    color_harmony,
    color_query,
    color_select,
    color_sets,
    color_space,
    hex_copy,
)
from app.services.prompts.common import (
    get_color_database_summary,
    get_color_selection_rules_section,
    get_communication_style_section,
    get_knowledge_base_section,
    get_material_design_context_section,
)
from app.services.prompts.live_system._cross_tool_rules import (
    CROSS_TOOL_RULES_EN,
    CROSS_TOOL_RULES_JA,
)
from app.services.prompts.live_system._persona import PERSONA_EN, PERSONA_JA
from app.services.prompts.live_system._role import ROLE_EN, ROLE_JA
from app.services.prompts.live_system._tone import TONE_EN, TONE_JA

# ツールファイルのルールを収集する順序（表示順）
_TOOL_MODULES = [
    color_space,  # CHANGE_SHAPE — 「必ずtool call」ルールを先頭に
    color_adjust,
    color_query,
    color_select,
    color_bridge,
    color_harmony,
    color_sets,
    hex_copy,
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
    color_summary = get_color_database_summary()
    knowledge_base = get_knowledge_base_section(language)
    material_design_context = get_material_design_context_section(language).format(
        color_summary=color_summary
    )
    communication_style = get_communication_style_section(language, is_tool_call_based=True)
    color_selection_rules = get_color_selection_rules_section(language)
    tool_rules = _collect_tool_rules(language)

    if language == "en":
        persona_section = PERSONA_EN
        role_section = ROLE_EN
        tone_style_section = TONE_EN
        cross_tool_rules = CROSS_TOOL_RULES_EN
        tool_usage_header = "## Tool usage rules"
    else:
        persona_section = PERSONA_JA
        role_section = ROLE_JA
        tone_style_section = TONE_JA
        cross_tool_rules = CROSS_TOOL_RULES_JA
        tool_usage_header = "## tool call ルール"

    text = (
        f"{persona_section}\n"
        f"{role_section}\n"
        f"{knowledge_base}\n"
        f"\n"
        f"{material_design_context}\n"
        f"\n"
        f"{tone_style_section}\n"
        f"\n"
        f"{tool_usage_header}\n"
        f"{tool_rules}\n"
        f"{cross_tool_rules}\n"
        f"\n"
        f"{color_selection_rules}\n"
        f"\n"
        f"{communication_style}"
    )

    return {"role": "system", "parts": [{"text": text}]}
