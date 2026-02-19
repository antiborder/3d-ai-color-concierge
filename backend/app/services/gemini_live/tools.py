"""
Gemini Live ツール定義と変換関数。
"""

from __future__ import annotations


def tool_call_function_calls(tool_call) -> list:
    """
    tool_call から function_calls を取り出す（SDK差分を吸収）。
    """
    if tool_call is None:
        return []
    function_calls = getattr(tool_call, "function_calls", None) or getattr(tool_call, "functionCalls", None)
    if function_calls is None and isinstance(tool_call, dict):
        function_calls = tool_call.get("function_calls") or tool_call.get("functionCalls")
    if not function_calls:
        return []
    # SDKにより tuple 等もあり得るが、とにかく iterable を list 化する
    try:
        return list(function_calls)
    except Exception:
        return []


def tool_call_to_frontend_command(name: str, args: dict) -> dict:
    """
    tool call args -> frontend command schema へ変換。
    外部挙動を変えないため、現行のキー/型変換に合わせる。
    """
    cmd: dict = {"action": name, "parameters": {}}
    if name == "SELECT_COLOR":
        cmd["parameters"] = {
            "color": {
                "r": int(args.get("r", 0)),
                "g": int(args.get("g", 0)),
                "b": int(args.get("b", 0)),
            }
        }
    elif name == "SET_COLOR":
        for k in ("r", "g", "b"):
            if k in args:
                cmd["parameters"][k] = int(args[k])
    elif name == "ADJUST_VALUE":
        cmd["parameters"] = {
            "property": args.get("property"),
            "direction": args.get("direction"),
        }
        if "amount" in args:
            cmd["parameters"]["amount"] = args.get("amount")
    elif name == "CHANGE_SHAPE":
        cmd["parameters"] = {"colorSpace": args.get("colorSpace")}
    elif name == "TOGGLE_LABEL":
        cmd["parameters"] = {"visible": args.get("visible")}
    else:
        cmd["parameters"] = args
    return cmd


def live_tools() -> list[dict]:
    """
    Gemini Live tools (function_declarations).
    We keep the schema minimal and map directly to the frontend's command model.
    """
    # NOTE: google-genai expects the "tools" structure to be a list of tool entries.
    # The most common form is:
    #   [{"function_declarations": [{"name": "...", "parameters": {...}}, ...]}]
    return [
        {
            "function_declarations": [
                {
                    "name": "SELECT_COLOR",
                    "description": "Select a specific RGB color.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "r": {"type": "integer", "minimum": 0, "maximum": 255},
                            "g": {"type": "integer", "minimum": 0, "maximum": 255},
                            "b": {"type": "integer", "minimum": 0, "maximum": 255},
                        },
                        "required": ["r", "g", "b"],
                    },
                },
                {
                    "name": "SET_COLOR",
                    "description": "Set one or more RGB channels directly (r/g/b).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "r": {"type": "integer", "minimum": 0, "maximum": 255},
                            "g": {"type": "integer", "minimum": 0, "maximum": 255},
                            "b": {"type": "integer", "minimum": 0, "maximum": 255},
                        },
                    },
                },
                {
                    "name": "ADJUST_VALUE",
                    "description": "Adjust brightness/saturation/hue.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "property": {
                                "type": "string",
                                "enum": ["brightness", "saturation", "hue"],
                            },
                            "direction": {"type": "string", "enum": ["up", "down"]},
                            "amount": {"type": "number", "minimum": 0},
                        },
                        "required": ["property", "direction"],
                    },
                },
                {
                    "name": "CHANGE_SHAPE",
                    "description": "Switch color space / UI shape (RGB/CMYK/HSL/HSV).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "colorSpace": {
                                "type": "string",
                                "enum": ["RGB", "CMYK", "HSL", "HSV"],
                            }
                        },
                        "required": ["colorSpace"],
                    },
                },
                {
                    "name": "TOGGLE_LABEL",
                    "description": "Toggle label visibility.",
                    "parameters": {
                        "type": "object",
                        "properties": {"visible": {"type": "boolean"}},
                    },
                },
                {
                    "name": "GET_CURRENT_COLOR",
                    "description": "Get the current selected color state (latest snapshot from the UI).",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    },
                },
            ]
        }
    ]


def live_system_instruction(language: str) -> dict:
    """
    Provide role + tool-usage instruction to Gemini Live.
    We intentionally avoid the old 'JSON-only response' constraint here and instead
    rely on tool calls for UI actions.
    """
    if language == "en":
        text = (
            "You are ai-color-concierge for a 3D color picker.\n"
            "Your job is to help the user change colors and UI state, and also chat naturally.\n"
            "\n"
            "## Tool usage rules\n"
            "- If the user asks to change color / adjust brightness/saturation/hue / change color space / toggle labels, you MUST use a tool call.\n"
            "- If the user asks what the current color is (e.g. \"What is the current RGB?\"), you MUST call GET_CURRENT_COLOR first.\n"
            "- Available tools: SELECT_COLOR, SET_COLOR, ADJUST_VALUE, CHANGE_SHAPE, TOGGLE_LABEL, GET_CURRENT_COLOR.\n"
            "- After making the tool call, also respond naturally (short) in English (audio response).\n"
            "- If it is not a UI action, respond normally with suggestions and explanations.\n"
        )
    else:
        text = (
            "あなたは3Dカラーピッカーの ai-color-concierge です。\n"
            "ユーザーの意図を理解し、色やUI状態を音声で手早く操作できるように支援しつつ、自然に会話してください。\n"
            "\n"
            "## tool call ルール\n"
            "- ユーザーの発話がUI操作（色変更/明度・彩度・色相調整/色空間変更/ラベル表示切替）に該当する場合は、必ず tool call を使ってください。\n"
            "- ユーザーが「今の色は？」「現在のRGBを教えて」など現在色の確認を求めた場合は、必ず最初に GET_CURRENT_COLOR を tool call してください。\n"
            "- 利用可能な tool: SELECT_COLOR, SET_COLOR, ADJUST_VALUE, CHANGE_SHAPE, TOGGLE_LABEL, GET_CURRENT_COLOR。\n"
            "- tool call を出した後も、会話として自然な短い返答を日本語で話してください（音声応答）。\n"
            "- UI操作に該当しない場合は、通常の会話として色の提案や説明をしてください。\n"
        )
    # LiveConnectConfig.system_instruction は Content として解釈される（dictでもOK）
    return {"role": "system", "parts": [{"text": text}]}
