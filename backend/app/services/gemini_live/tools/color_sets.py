"""SET_COLOR_SETS — 3D空間に表示するカラーセットの切り替えツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "SET_COLOR_SETS",
        "description": (
            "Show or hide color sets displayed in the 3D space. "
            "When any key is set to true, all other sets are automatically hidden — "
            "you only need to specify the set(s) you want to show. "
            "To turn off a set without showing another, set it explicitly to false. "
            "Available sets: 'css' (CSS named colors), 'material' (Material Design colors), "
            "'japanese' (Japanese traditional colors / 日本の伝統色), "
            "'rgbGrid' (RGB grid colors). "
            "Example — 'show Japanese colors': set japanese=true (others hide automatically)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "css": {"type": "boolean", "description": "CSS named colors"},
                "material": {"type": "boolean", "description": "Material Design colors"},
                "japanese": {
                    "type": "boolean",
                    "description": "Japanese traditional colors (日本の伝統色)",
                },
                "rgbGrid": {"type": "boolean", "description": "RGB grid colors"},
            },
        },
    },
]

_VALID_KEYS = ("css", "material", "japanese", "rgbGrid")


def _set_color_sets(args: dict) -> dict:
    return {k: bool(args[k]) for k in _VALID_KEYS if k in args}


COMMANDS: dict[str, object] = {
    "SET_COLOR_SETS": _set_color_sets,
}

RULES_JA = """\
- ユーザーが特定のカラーセットを表示したい場合は SET_COLOR_SETS を呼び出してください。表示したいセットを true に設定するだけで、他のセットは自動的に非表示になります。非表示にするだけの場合は明示的に false を指定してください。カラーセット: css, material, japanese, rgbGrid。\
"""

RULES_EN = """\
- If the user asks to show a specific color set, call SET_COLOR_SETS and set the desired set(s) to true — all others are automatically hidden. To hide a set without showing another, set it explicitly to false. Color sets: css, material, japanese, rgbGrid.\
"""
