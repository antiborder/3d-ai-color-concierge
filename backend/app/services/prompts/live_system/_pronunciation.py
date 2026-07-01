"""発音ガイドセクション（日本語音声読み上げ用）。"""

from __future__ import annotations

PRONUNCIATION_DICT: dict[str, str] = {
    "色調": "しきちょう",
    "色相": "しきそう",
    "鮮やかさ": "あざやかさ",
    "鮮度": "せんど",
    "色味": "いろみ",
    "彩度": "さいど",
    "明度": "明度",
    "明るさ": "あかるさ",
    "暗さ": "くらさ",
    "濃さ": "こいさ",
    "鮮やか": "あざやか",
    "鮮度": "せんど",
    "色味": "いろみ",
    "滑らか": "なめらか",
    "輝度": "きど",
    "鮮やかに": "あざやかに",
    "最も": "もっとも",
    "色相間": "しきそうかん",
    "色度図": "しきどず",
    "色度": "しきど",
}


def _build_section() -> str:
    lines = "\n".join(f"- {k} → {v}" for k, v in PRONUNCIATION_DICT.items())
    return (
        "## 発音ガイド\n"
        "以下の単語を音声で話す際は、必ず括弧内の読みで発話してください：\n"
        f"{lines}"
    )


PRONUNCIATION_SECTION_JA = _build_section()
PRONUNCIATION_SECTION_EN = ""
