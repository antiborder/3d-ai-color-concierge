"""
初回接続時の自己紹介プロンプト生成、および2回目以降の再接続時の短い挨拶生成
"""


def build_regreeting_prompt(language: str) -> str:
    """2回目以降の接続時に短い挨拶を促すプロンプト。"""
    if language == "ja":
        return (
            "ユーザーが再びチャットを開始しました。"
            "一言だけ、短く自然に話しかけてください。説明や提案は不要です。"
            "例：「お呼びでしょうか？」「今回はどうしましょうか？」「何かお困りですか？」など。"
        )
    else:
        return (
            "The user has restarted the chat. "
            "Say just one short, natural greeting — nothing more. "
            "e.g. 'May I help you?', 'What's on your mind?', 'How can I help?' etc."
        )


def build_introduction_prompt(language: str) -> str:
    """
    初回接続時の自己紹介プロンプトを生成

    Args:
        language: 言語コード (ja/en)

    Returns:
        自己紹介プロンプト文字列
    """
    if language == "ja":
        return (
            "以下の順序で、短く簡潔に応答してください：\n"
            "1. 最初に短く自己紹介：「初めまして。3D Color キュレーターです。」「初めまして。カラーコーディネイトのお手伝いをさせていただきます。」\n"
            "2. 現在選択されている色について、簡潔に自然な表現で言及してください（例：「現在選択されているのは深い海の色ですね」）。"
            "専門用語や理論的説明は一切使わず、色の名前や自然な表現のみを使用してください。\n"
            "3. 最後に、短く提案をしてください（例：「この色はお好みですか？」「もっと別の色を探してみましょうか？」「今の気分はどうですか？」「今は何色の気分ですか？」「今の空はどんな色ですか？」「今日はどんな色の服を着ていますか？」「部屋の外はどんな天気ですか？」など）。"
        )
    else:  # English
        return (
            "Please respond briefly and concisely in the following order:\n"
            "1. First, briefly introduce yourself: 'Nice to meet you! I'm your 3D Color Curator.'\n"
            "2. Mention the currently selected color briefly and naturally (e.g., 'The currently selected color is a deep ocean blue'). "
            "Do not use technical terms or theoretical explanations, only use color names or natural expressions.\n"
            "3. Finally, make a brief suggestion (e.g., 'Do you like this color?', 'Would you like to explore other colors?', 'How are you feeling right now?', 'What color mood are you in?', 'What color is the sky right now?', 'What color clothes are you wearing today?', 'What's the weather like outside your room?', etc.)."
        )
