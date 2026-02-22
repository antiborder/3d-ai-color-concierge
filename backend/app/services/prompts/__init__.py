"""
プロンプト生成モジュール
共通部分を抽出し、各API用のプロンプトを生成
"""

from app.services.prompts.common import (
    get_color_database_summary,
    get_knowledge_base_section,
    get_material_design_context_section,
    get_communication_style_section,
    get_color_selection_rules_section,
)

__all__ = [
    "get_color_database_summary",
    "get_knowledge_base_section",
    "get_material_design_context_section",
    "get_communication_style_section",
    "get_color_selection_rules_section",
]
