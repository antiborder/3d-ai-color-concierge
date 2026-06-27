"""SET_COLOR_SETS — 3D空間に表示するカラーセットの切り替えツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "SET_COLOR_SETS",
        "description": (
            "Show or hide color sets displayed in the 3D space. "
            "Each key is optional — omit a key to leave that set unchanged. "
            "Use this when the user wants to toggle specific color sets or say 'show only X'. "
            "Available sets: 'css' (CSS named colors), 'material' (Material Design colors), "
            "'spectral12' (spectral 12 colors), 'japanese' (Japanese traditional colors / 日本の伝統色), "
            "'rgbGrid' (RGB grid colors). "
            "Example — 'show only Japanese colors': set japanese=true and all others to false."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "css": {"type": "boolean", "description": "CSS named colors"},
                "material": {"type": "boolean", "description": "Material Design colors"},
                "spectral12": {"type": "boolean", "description": "Spectral 12 colors"},
                "japanese": {
                    "type": "boolean",
                    "description": "Japanese traditional colors (日本の伝統色)",
                },
                "rgbGrid": {"type": "boolean", "description": "RGB grid colors"},
            },
        },
    },
]

_VALID_KEYS = ("css", "material", "spectral12", "japanese", "rgbGrid")


def _set_color_sets(args: dict) -> dict:
    return {k: bool(args[k]) for k in _VALID_KEYS if k in args}


COMMANDS: dict[str, object] = {
    "SET_COLOR_SETS": _set_color_sets,
}

RULES_JA = """\
- ユーザーが特定のカラーセットの表示切替を求めたり「〇〇だけ表示して」と言った場合は SET_COLOR_SETS を呼び出してください。変えないキーは省略可。「〇〇だけ表示」の場合は〇〇=true、他すべてを false に設定してください。カラーセット: css, material, spectral12, japanese, rgbGrid。\
"""

RULES_EN = """\
- If the user asks to show/hide a specific color set or says "show only X colors", call SET_COLOR_SETS. Omit keys you don't want to change. For "show only X", set X=true and all others to false. Color sets: css, material, spectral12, rgbGrid.\
"""
