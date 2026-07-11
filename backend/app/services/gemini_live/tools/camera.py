"""RESET_ZOOM — カメラのズーム距離をリセットするツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "RESET_ZOOM",
        "description": (
            "Reset the camera zoom to the default distance so the full 3D color space is visible. "
            "Use when the user says they want to zoom out, see the whole shape, or the view is too close."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
]


def _reset_zoom(args: dict) -> dict:
    return {}


COMMANDS: dict[str, object] = {
    "RESET_ZOOM": _reset_zoom,
}

RULES_JA = """\
- ユーザーが「ズームアウト」「離して」「全体を見せて」「近すぎる」「引いて」などと言った場合は RESET_ZOOM を呼んでください。\
"""

RULES_EN = """\
- When the user says "zoom out", "zoom back", "too close", "show the whole thing", "step back", etc., call RESET_ZOOM.\
"""
