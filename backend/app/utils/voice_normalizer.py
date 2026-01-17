"""
音声認識結果の正規化ユーティリティ
最小限の正規化処理を実装（チャットで試しながら調整可能）
"""
import re
import logging
from typing import Dict

logger = logging.getLogger(__name__)

# カラー用語辞書（日本語）
COLOR_DICT_JA: Dict[str, str] = {
    # 基本色
    "あか": "赤",
    "あお": "青",
    "みどり": "緑",
    "きいろ": "黄色",
    "き": "黄色",
    "むらさき": "紫",
    "オレンジ": "オレンジ",
    "おれんじ": "オレンジ",
    "ピンク": "ピンク",
    "ちゃいろ": "茶色",
    "くろ": "黒",
    "しろ": "白",
    "グレー": "グレー",
    "はいいろ": "グレー",
    # 色の表現（補助的な修正）
    "あかるい": "明るい",
    "くらい": "暗い",
    "うすい": "薄い",
    "こい": "濃い",
    "あざやか": "鮮やかな",
}

# カラー用語辞書（英語）
COLOR_DICT_EN: Dict[str, str] = {
    # 基本色（小文字に統一）
    "red": "red",
    "blue": "blue",
    "green": "green",
    "yellow": "yellow",
    "purple": "purple",
    "orange": "orange",
    "pink": "pink",
    "brown": "brown",
    "black": "black",
    "white": "white",
    "gray": "gray",
    "grey": "gray",  # イギリス英語の表記も統一
    # 色の表現
    "bright": "bright",
    "dark": "dark",
    "light": "light",
    "pale": "pale",
    "vivid": "vivid",
    "calm": "calm",
    "warm": "warm",
    "cool": "cool",
}

# 全角数字から半角数字への変換マップ
FULLWIDTH_TO_HALFWIDTH = str.maketrans(
    "０１２３４５６７８９",
    "0123456789"
)


def normalize_whitespace(text: str) -> str:
    """
    空白文字の正規化
    - 連続する空白を1つに統一
    - 前後の空白を除去
    """
    # 連続する空白を1つに統一
    text = re.sub(r'\s+', ' ', text)
    # 前後の空白を除去
    text = text.strip()
    return text


def normalize_numbers(text: str) -> str:
    """
    数値の正規化（最小限）
    - 全角数字を半角数字に変換
    - 日本語の数字表記は現時点では対応しない（必要に応じて追加）
    """
    # 全角数字を半角数字に変換
    text = text.translate(FULLWIDTH_TO_HALFWIDTH)
    return text


def normalize_color_terms(text: str, language: str = "ja") -> str:
    """
    カラー用語の辞書マッチング
    
    Args:
        text: 正規化対象のテキスト
        language: 言語コード (ja/en)
    
    Returns:
        正規化されたテキスト
    """
    color_dict = COLOR_DICT_JA if language == "ja" else COLOR_DICT_EN
    
    # 単語単位でマッチング（最小限の実装）
    words = text.split()
    normalized_words = []
    
    for word in words:
        # 辞書に存在する場合は置換
        if word.lower() in color_dict:
            normalized_word = color_dict[word.lower()]
            # 元の大文字小文字を保持（英語の場合）
            if language == "en" and word[0].isupper():
                normalized_word = normalized_word.capitalize()
            normalized_words.append(normalized_word)
        else:
            normalized_words.append(word)
    
    return " ".join(normalized_words)


def normalize_transcript(transcript: str, language: str = "ja") -> str:
    """
    音声認識結果の正規化（メイン関数）
    
    処理順序:
    1. 空白の正規化
    2. 数値の正規化
    3. カラー用語の辞書マッチング
    
    Args:
        transcript: 音声認識結果のテキスト
        language: 言語コード (ja/en)
    
    Returns:
        正規化されたテキスト
    """
    if not transcript:
        return transcript
    
    # 元のテキストをログに記録（デバッグ用）
    original = transcript
    
    # 1. 空白の正規化
    normalized = normalize_whitespace(transcript)
    
    # 2. 数値の正規化
    normalized = normalize_numbers(normalized)
    
    # 3. カラー用語の辞書マッチング
    normalized = normalize_color_terms(normalized, language)
    
    # 変更があった場合はログに記録
    if original != normalized:
        logger.debug(f"Transcript normalized: '{original}' -> '{normalized}'")
    
    return normalized
