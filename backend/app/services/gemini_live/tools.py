"""
Gemini Live ツール定義と変換関数。
"""

from __future__ import annotations


def rgb_to_cmyk(r: int, g: int, b: int) -> tuple[float, float, float, float]:
    """
    RGB値をCMYK値に変換
    """
    if r == 0 and g == 0 and b == 0:
        return (0.0, 0.0, 0.0, 100.0)
    
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0
    
    k = 1.0 - max(r_norm, g_norm, b_norm)
    if k == 1.0:
        return (0.0, 0.0, 0.0, 100.0)
    
    c = (1.0 - r_norm - k) / (1.0 - k)
    m = (1.0 - g_norm - k) / (1.0 - k)
    y = (1.0 - b_norm - k) / (1.0 - k)
    
    return (c * 100.0, m * 100.0, y * 100.0, k * 100.0)


def rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    """
    RGB値をHSL値に変換
    """
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0
    
    max_val = max(r_norm, g_norm, b_norm)
    min_val = min(r_norm, g_norm, b_norm)
    delta = max_val - min_val
    
    # Lightness
    l = (max_val + min_val) / 2.0
    
    if delta == 0:
        # Grayscale
        h = 0.0
        s = 0.0
    else:
        # Saturation
        if l < 0.5:
            s = delta / (max_val + min_val)
        else:
            s = delta / (2.0 - max_val - min_val)
        
        # Hue
        if max_val == r_norm:
            h = ((g_norm - b_norm) / delta) % 6.0
        elif max_val == g_norm:
            h = (b_norm - r_norm) / delta + 2.0
        else:
            h = (r_norm - g_norm) / delta + 4.0
        h *= 60.0
        if h < 0:
            h += 360.0
    
    return (h, s * 100.0, l * 100.0)


def determine_optimal_color_space(r: int, g: int, b: int, adjust_property: str | None = None) -> str:
    """
    色の特性に基づいて最適な色空間を決定
    
    Args:
        r: Red値 (0-255)
        g: Green値 (0-255)
        b: Blue値 (0-255)
        adjust_property: 調整するプロパティ ("hue", "saturation", "brightness" など)
    
    Returns:
        最適な色空間 ("RGB", "CMYK", "HSL", "HSV")
    """
    # ADJUST_VALUEでH、S、Lの調整指示があった場合はHSLへ変形
    if adjust_property in ("hue", "saturation", "brightness"):
        return "HSL"
    
    # HSLに変換してLightnessを確認
    h, s, l = rgb_to_hsl(r, g, b)
    
    # 色が白に非常に近い場合（L >= 90）はHSL空間へ変形
    if l >= 90:
        return "HSL"
    
    # RGBのcubeの頂点に相当する場合、または1つのチャンネルだけで表せる場合
    # 閾値: 他の2つのチャンネルが10以下
    threshold = 10
    non_zero_channels = [ch for ch in [(r, 'R'), (g, 'G'), (b, 'B')] if ch[0] > threshold]
    
    if len(non_zero_channels) == 1:
        # 1つのチャンネルだけで表せる場合
        return "RGB"
    
    # RGBのcubeの頂点（(255,0,0), (0,255,0), (0,0,255)など）
    if (r == 255 and g == 0 and b == 0) or \
       (r == 0 and g == 255 and b == 0) or \
       (r == 0 and g == 0 and b == 255):
        return "RGB"
    
    # CMYKに変換して判定
    c, m, y, k = rgb_to_cmyk(r, g, b)
    
    # CMYKでC、M、Yのうち1つだけが非ゼロ（またはK以外が1つだけ非ゼロ）の場合
    # 閾値: 他の成分が5%以下
    cmyk_threshold = 5.0
    non_zero_cmyk = [val for val in [(c, 'C'), (m, 'M'), (y, 'Y')] if val[0] > cmyk_threshold]
    
    if len(non_zero_cmyk) == 1 and k < cmyk_threshold:
        # C、M、Yのうち1つだけで表せる場合
        return "CMYK"
    
    # 特定のパターン: (0,255,255) -> Cyan, (255,0,255) -> Magenta, (255,255,0) -> Yellow
    if (r == 0 and g == 255 and b == 255) or \
       (r == 255 and g == 0 and b == 255) or \
       (r == 255 and g == 255 and b == 0):
        return "CMYK"
    
    # それ以外の場合はHSVに変形
    return "HSV"


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
        r = int(args.get("r", 0))
        g = int(args.get("g", 0))
        b = int(args.get("b", 0))
        cmd["parameters"] = {
            "color": {
                "r": r,
                "g": g,
                "b": b,
            },
            # 最適な色空間を自動決定
            "optimalColorSpace": determine_optimal_color_space(r, g, b),
        }
    elif name == "SET_COLOR":
        for k in ("r", "g", "b"):
            if k in args:
                cmd["parameters"][k] = int(args[k])
    elif name == "ADJUST_VALUE":
        property_name = args.get("property")
        # H、S、Lの調整指示があった場合は最適な色空間をHSLに設定
        if property_name in ("hue", "saturation", "brightness"):
            cmd["parameters"] = {
                "property": property_name,
                "direction": args.get("direction"),
                "optimalColorSpace": "HSL",
            }
        else:
            cmd["parameters"] = {
                "property": property_name,
                "direction": args.get("direction"),
            }
        if "amount" in args:
            cmd["parameters"]["amount"] = args.get("amount")
    elif name == "CHANGE_SHAPE":
        cmd["parameters"] = {"colorSpace": args.get("colorSpace")}
    elif name == "SET_HARMONY":
        cmd["parameters"] = {"mode": args.get("mode")}
    elif name == "SET_COLOR_SETS":
        valid_keys = ("css", "material", "spectral12", "japanese", "rgbGrid")
        cmd["parameters"] = {k: bool(args[k]) for k in valid_keys if k in args}
    elif name == "COPY_HEX":
        cmd["parameters"] = {}
    elif name == "SET_HEX":
        cmd["parameters"] = {"hex": args.get("hex")}
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
                    "description": "Select a specific RGB color by name or description. You MUST provide all three RGB values (r, g, b). For example: white = (255, 255, 255), black = (0, 0, 0), red = (255, 0, 0). Use this tool when the user asks to select a color by name or description.",
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
                    "description": "Set one or more RGB channels directly for fine-tuning. This is for adjusting individual channels (r/g/b), NOT for selecting colors by name. For color selection by name (e.g., 'white', 'black'), use SELECT_COLOR instead.",
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
                    "description": "Adjust the current color's brightness, saturation, or hue while preserving the current color. All adjustments are performed in HSL color space (brightness = lightness 'L', saturation = saturation 'S', hue = hue 'H'). HSL ranges: saturation 's' is always 0–100 (100 = fully saturated, NOT 80 or any other value), lightness 'l' is always 0–100, hue 'h' is always 0–360. IMPORTANT: Before using this tool, you should call GET_CURRENT_COLOR to get the current color state. This tool modifies the current color in place, NOT selecting a new color. Direction: 'up' means increase (brighter, more vibrant), 'down' means decrease (darker, less vibrant). For selecting a new color by name or description, use SELECT_COLOR instead.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "property": {
                                "type": "string",
                                "enum": ["brightness", "saturation", "hue"],
                            },
                            "direction": {"type": "string", "enum": ["up", "down"], "description": "'up' for increase (brighter, more vibrant), 'down' for decrease (darker, less vibrant)"},
                            "amount": {"type": "number", "minimum": 0, "description": "Absolute adjustment amount on a 0-100 scale for brightness/saturation (e.g., 10 means add/subtract 10 points), or 0-360 scale for hue. When user says '10%', use 10 (absolute points), NOT a fraction of the current value. Default is 10 if not specified."},
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
                    "name": "GET_CURRENT_COLOR",
                    "description": "Get the current selected color state (latest snapshot from the UI). When responding to users about the current color, describe it using color names or natural expressions only. NEVER mention RGB values or numeric values like 255,79,24.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    },
                },
                {
                    "name": "GET_CLOSEST_COLOR",
                    "description": (
                        "Find the closest matching color names from the database for the currently selected color. "
                        "Use this when the user asks 'what color is this?', 'what is this color called?', "
                        "'what Japanese traditional color is closest to this?', or any question about identifying the current color by name. "
                        "Returns the top 5 closest colors with their names, hex codes, and RGB distance. "
                        "Describe the results using the color names — do NOT mention RGB values or distance numbers to the user."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    },
                },
                {
                    "name": "SEARCH_COLOR",
                    "description": (
                        "Search the color database by name (partial match). "
                        "Use this BEFORE SELECT_COLOR when the user mentions a color by name (e.g., 'Pink 800', 'sky blue', '群青色', '青っぽい色'). "
                        "Returns a list of matching colors with exact RGB values. "
                        "If multiple results are returned, present the options to the user and ask which one they want, "
                        "then call SELECT_COLOR with the chosen color's RGB values. "
                        "If one result is returned, call SELECT_COLOR immediately with that color's RGB values."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Color name to search for (partial match, e.g. 'Pink 800', 'sky blue', '群青', '青').",
                            }
                        },
                        "required": ["query"],
                    },
                },
                {
                    "name": "GET_COLOR_HISTORY",
                    "description": "Get the list of colors the user has selected during this session, from most recent to oldest. Use this when the user asks about previously chosen colors, wants to return to an earlier color, or asks what colors they have tried. Describe colors using natural expressions or color names, not RGB values.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    },
                },
                {
                    "name": "COPY_HEX",
                    "description": "Copy the current color's HEX code to the user's clipboard. Use this when the user asks to copy the hex code, share the color code, or save the current color's hex value.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                    },
                },
                {
                    "name": "SET_HARMONY",
                    "description": (
                        "Show or hide color harmony markers in 3D space. "
                        "PROACTIVELY call this tool whenever you: "
                        "(1) recommend or mention complementary colors, "
                        "(2) suggest changing hue dramatically, "
                        "(3) explain any color harmony theory (triadic, tetradic, etc.), "
                        "(4) want to visually demonstrate color relationships. "
                        "Use mode='none' to hide harmony markers when the topic is no longer about harmony. "
                        "Modes: 'complementary' (2 colors, 180°), 'triangle' (3, 120°), 'square' (4, 90°), "
                        "'pentagon' (5, 72°), 'hexagon' (6, 60°), 'heptagon' (7), 'octagon' (8, 45°), 'nonagon' (9, 40°)."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "mode": {
                                "type": "string",
                                "enum": ["none", "complementary", "triangle", "square", "pentagon", "hexagon", "heptagon", "octagon", "nonagon"],
                                "description": "Harmony mode to display. Use 'none' to clear harmony markers.",
                            }
                        },
                        "required": ["mode"],
                    },
                },
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
                            "css":       {"type": "boolean", "description": "CSS named colors"},
                            "material":  {"type": "boolean", "description": "Material Design colors"},
                            "spectral12":{"type": "boolean", "description": "Spectral 12 colors"},
                            "japanese":  {"type": "boolean", "description": "Japanese traditional colors (日本の伝統色)"},
                            "rgbGrid":   {"type": "boolean", "description": "RGB grid colors"},
                        },
                    },
                },
                {
                    "name": "SET_HEX",
                    "description": "Set the current color directly from a HEX code (e.g. '#FF5733' or 'FF5733'). Use this when the user specifies a color by its hex code.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "hex": {
                                "type": "string",
                                "description": "6-digit hex color code, with or without '#' prefix (e.g. '#FF5733' or 'FF5733').",
                            }
                        },
                        "required": ["hex"],
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
    from app.services.prompts.live_system import build_live_system_instruction
    return build_live_system_instruction(language)
