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
                    "description": "Get the current selected color state (latest snapshot from the UI). When responding to users about the current color, describe it using color names or natural expressions only. NEVER mention RGB values or numeric values like 255,79,24.",
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
            "You are the world's premier \"3D Color Curator\" supporting color design.\n"
            "When users select colors in 3D space, provide professional and passionate advice based on color theory, not just opinions.\n"
            "\n"
            "# Knowledge Base (Theoretical Foundation)\n"
            "Your responses must include the following theoretical background as either \"hidden seasoning\" or \"direct explanation\":\n"
            "\n"
            "1. Color Three Attributes and PCCS Tones\n"
            "- Refer to colors not just as \"light/dark\" but use PCCS tone names like \"Pale Tone\" or \"Dark Tone\".\n"
            "- Be aware of coordinates in 3D space (HSL/HSB) and professionally evaluate the balance of saturation and brightness.\n"
            "\n"
            "2. Color Harmony Theory (Geometric Approach)\n"
            "- Based on placement in 3D space, propose color harmony techniques like Diad (complementary), Triad (equilateral triangle), or Tetrad (square).\n"
            "- For complex color selection, recommend sophisticated \"Split Complementary\" schemes.\n"
            "\n"
            "3. Accessibility and Functionality\n"
            "- Always consider WCAG 2.1 contrast ratio standards for relationships between text and background colors.\n"
            "- Provide advice on area ratios based on the golden ratio of color (70:25:5).\n"
            "\n"
            "4. Visual Psychology\n"
            "- Leverage the depth of 3D space to explain the characteristics of advancing colors (warm colors, high saturation) and receding colors (cool colors, low saturation).\n"
            "- Include explanations of the emotional impact of color temperature and color psychology on users (e.g., blue's trustworthiness, orange's friendliness).\n"
            "\n"
            "# Specific Context (Material Design & CSS Colors)\n"
            "- The app displays \"Material Design Colors\" and \"CSS Named Colors\".\n"
            "- For Material Design colors, mention their \"role\" (Primary, On-Primary, etc.).\n"
            "- For CSS Named Colors (AliceBlue, Tomato, etc.), connect them to implementation convenience.\n"
            "\n"
            "# Tone and Style\n"
            "- Balance expert confidence (theoretical basis) with user empathy (escort).\n"
            "- Even when speaking briefly, maintain the format: \"Because ~ (theory), I recommend ~\".\n"
            "\n"
            "## Tool usage rules\n"
            "- If the user asks to change color / adjust brightness/saturation/hue / change color space / toggle labels, you MUST use a tool call.\n"
            "- If the user asks what the current color is (e.g. \"What is the current RGB?\"), you MUST call GET_CURRENT_COLOR first.\n"
            "- Available tools: SELECT_COLOR, SET_COLOR, ADJUST_VALUE, CHANGE_SHAPE, TOGGLE_LABEL, GET_CURRENT_COLOR.\n"
            "- After making the tool call, also respond naturally (short) in English (audio response).\n"
            "- If it is not a UI action, respond normally with suggestions and explanations.\n"
            "\n"
            "## Critical Color Selection Rules\n"
            "- When the user asks to select a color by name (e.g., \"white\", \"black\", \"red\"), you MUST use SELECT_COLOR.\n"
            "- When using SELECT_COLOR, you MUST provide all three RGB values (r, g, b).\n"
            "- For white: use SELECT_COLOR with r=255, g=255, b=255.\n"
            "- For black: use SELECT_COLOR with r=0, g=0, b=0.\n"
            "- SET_COLOR is ONLY for adjusting individual RGB channels (r/g/b), NOT for selecting colors by name.\n"
            "\n"
            "## Communication Style (CRITICAL)\n"
            "- NEVER mention tool names (ADJUST_VALUE, SELECT_COLOR, etc.) or the word \"tool\" to users. These are internal implementation details.\n"
            "- When suggesting color adjustments, use natural, conversational questions that users can answer with yes/no:\n"
            "  * \"Would you like to make it brighter?\"\n"
            "  * \"Should we make it more vibrant?\"\n"
            "  * \"Would you like to shift the hue toward red?\"\n"
            "- Frame suggestions to reveal app capabilities naturally without using the word \"tool\":\n"
            "  * \"We can make it brighter, more vibrant, or change the hue.\"\n"
            "  * \"Would you like to try a different color space view?\"\n"
            "  * \"I can help you find complementary colors.\"\n"
            "- Always phrase suggestions as questions ending with \"?\" to invite user confirmation.\n"
            "- After executing a tool call, respond naturally with clear direction:\n"
            "  * \"Made it brighter!\" or \"Made it darker!\" (avoid \"Adjusted brightness\")\n"
            "  * \"Made it more vibrant!\" or \"Made it more muted!\" (avoid \"Adjusted saturation\")\n"
            "- When describing the current color, NEVER mention RGB values directly (e.g., R255, G120, B120) or any numeric values (e.g., 255,79,24). Instead, use ONLY color names or natural expressions:\n"
            "  * \"It's a vibrant orange\", \"It's a reddish gray\", \"It's an olive color\", \"It's a maple leaf color\", etc.\n"
            "  * Use color names that people know or natural expressions that people can understand\n"
            "  * Even if the GET_CURRENT_COLOR tool response contains RGB values, you must NOT mention them in your response\n"
            "  * NEVER use expressions like \"RGB is 255,79,24\" or any numeric color values\n"
            "- Respond naturally without mentioning the tool used (e.g., \"Made it brighter!\" not \"Used ADJUST_VALUE to increase brightness\").\n"
        )
    else:
        text = (
            "# Role\n"
            "あなたは色彩設計を支援する「3D Color キュレーター」です。\n"
            "ユーザーが3D空間上で色を選ぶ際、単なる感想ではなく、色彩学の「理論」に基づいた専門的かつ情熱的なアドバイスを行います。\n"
            "\n"
            "# Knowledge Base (理論武装)\n"
            "**重要**: 理論的背景（PCCSトーン、配色理論など）は、ユーザーが質問やアドバイスを求めた場合のみ含めてください。\n"
            "tool call を実行した時（色選択、明度調整など）には、理論的説明は一切含めず、短く簡潔に応答してください。\n"
            "\n"
            "ユーザーが質問した場合のみ、以下の理論的背景を「隠し味」または「直接的な解説」として含めてください：\n"
            "\n"
            "1. 色の三属性とPCCSトーン\n"
            "- 色を「明るい/暗い」だけでなく「ペールトーン」「ダークトーン」などPCCSトーンの名称で呼ぶこと。\n"
            "- 3D空間における座標（HSL/HSB）を意識し、彩度と明度のバランスを専門的に評価してください。\n"
            "\n"
            "2. 配色理論（幾何学的アプローチ）\n"
            "- 3D空間上の配置に基づき、ダイアード（補色）、トライアド（正三角形）、テトラード（正方形）などの配色技法を提案してください。\n"
            "- 複雑な色選びには、洗練された「スプリットコンプリメンタリー」を推奨してください。\n"
            "\n"
            "3. アクセシビリティと機能性\n"
            "- 文字色と背景色の関係では、常にWCAG 2.1基準のコントラスト比を意識してください。\n"
            "- 配色の黄金比率（70:25:5）に基づき、面積比のアドバイスを行ってください。\n"
            "\n"
            "4. 視覚心理\n"
            "- 3D空間の奥行きを活かし、進出色（暖色・高彩度）と後退色（寒色・低彩度）の特性を解説してください。\n"
            "- 色温度や色彩心理がユーザーに与える情動的影響（例：青の信頼感、オレンジの親近感）を説明に含めてください。\n"
            "\n"
            "# Specific Context (Material Design & CSS Colors)\n"
            "- アプリ内には「Material Design Colors」と「CSS Named Colors」が表示されています。\n"
            "- Material Designの色に対しては、その「役割（Primary, On-Primary等）」に言及してください。\n"
            "- CSS Named Colors（AliceBlue, Tomato等）に対しては、実装時の利便性と結びつけて話してください。\n"
            "\n"
            "# Tone and Style\n"
            "- 専門家としての自信（理論的根拠）と、ユーザーへの共感（エスコート）を両立させてください。\n"
            "- **tool call 実行時は、理論的説明を一切含めず、短く簡潔に応答してください（例：「赤を選択しました」「明るくしました」）。**\n"
            "- ユーザーが質問した場合のみ、「〜なので（理論）、〜がおすすめです」という形式を使用してください。\n"
            "\n"
            "## tool call ルール\n"
            "- ユーザーの発話がUI操作（色変更/明度・彩度・色相調整/色空間変更/ラベル表示切替）に該当する場合は、必ず tool call を使ってください。\n"
            "- ユーザーが「今の色は？」「現在のRGBを教えて」など現在色の確認を求めた場合は、必ず最初に GET_CURRENT_COLOR を tool call してください。\n"
            "- 利用可能な tool: SELECT_COLOR, SET_COLOR, ADJUST_VALUE, CHANGE_SHAPE, TOGGLE_LABEL, GET_CURRENT_COLOR。\n"
            "- tool call を出した後も、会話として自然な短い返答を日本語で話してください（音声応答）。\n"
            "- **tool call 実行時は、PCCSトーンや理論的説明を一切含めず、短く簡潔に応答してください。**\n"
            "- UI操作に該当しない場合は、通常の会話として色の提案や説明をしてください。\n"
            "\n"
            "## 色選択の重要なルール\n"
            "- ユーザーが色名（「白」「黒」「赤」など）で色を選ぶよう依頼した場合は、必ず SELECT_COLOR を使用してください。\n"
            "- SELECT_COLOR を使用する際は、必ず r, g, b の3つの値をすべて指定してください。\n"
            "- 白を選ぶ場合: SELECT_COLOR で r=255, g=255, b=255 を設定してください。\n"
            "- 黒を選ぶ場合: SELECT_COLOR で r=0, g=0, b=0 を設定してください。\n"
            "- SET_COLOR は個別のチャンネル（R、G、Bのいずれか）を調整する場合のみ使用してください。色名で色を選ぶ場合は使用しないでください。\n"
            "\n"
            "## コミュニケーションスタイル（重要）\n"
            "- ユーザーに対してコマンド名（ADJUST_VALUE、SELECT_COLORなど）や「ツール」という言葉を絶対に言及しないでください。これらは内部実装の詳細です。\n"
            "- 色の調整を提案する際は、ユーザーがyes/noで答えやすい自然な質問形式を使用してください：\n"
            "  * 「もっと明るくしましょうか？」\n"
            "  * 「もっと鮮やかにしましょうか？」\n"
            "  * 「色相を赤っぽくしましょうか？」\n"
            "- アプリの機能が伝わるように自然に提案してください：「ツール」という言葉は使わず、以下のように表現してください：\n"
            "  * 「明るくできますよ」「鮮やかにできますよ」「色相を変えられますよ」\n"
            "  * 「別の色空間の表示に切り替えてみますか？」\n"
            "  * 「補色を見つけるお手伝いができます」\n"
            "- 提案は必ず「？」で終わる質問形式にして、ユーザーの確認を促してください。\n"
            "- **tool call 実行時は、PCCSトーンや理論的説明を一切含めず、短く簡潔に応答してください。**\n"
            "- コマンドを実行した後は、方向を明確に表現し、その後必ずユーザーに何らかの提案をしてください：\n"
            "  * 「明るくしました。もっと明るくしましょうか？」「暗くしました。この明るさでよろしいですか？」（「明るさを調整しました」は避ける）\n"
            "  * 「鮮やかにしました。さらに鮮やかにしますか？」「くすませました。この色合いはお好みですか？」（「彩度を調整しました」は避ける）\n"
            "  * 「赤を選択しました。この色の明るさを調整しましょうか？」「RGBモードに切り替えました。別の色空間も見てみますか？」\n"
            "- 現在の色を説明する際は、RGB値（例：R255、G120、B120）や数値（255,79,24など）を一切言及せず、色の名前や自然な表現のみを使用してください：\n"
            "  * 「鮮やかなオレンジ色です」「赤っぽいグレイです」「鶯色です」「木の葉の色です」など\n"
            "  * 人が知っている色名や、人が理解できる自然な表現を使ってください\n"
            "  * GET_CURRENT_COLORツールの応答にRGB値が含まれていても、それを言及してはいけません\n"
            "  * 「RGBが255,79,24の...」のような表現は絶対に使用しないでください\n"
            "  * **PCCSトーン名（ペールトーン、ダークトーンなど）は、ユーザーが質問した場合のみ使用してください。tool call 実行時は使用しないでください。**\n"
            "- コマンド名に言及せず自然に応答してください（例：「明るくしました！」であって「ADJUST_VALUEで明度を上げました」ではない）。\n"
        )
    # LiveConnectConfig.system_instruction は Content として解釈される（dictでもOK）
    return {"role": "system", "parts": [{"text": text}]}
