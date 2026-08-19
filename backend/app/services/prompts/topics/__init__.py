"""教育トピック定義とスクリプトガイドのプロンプト生成。

新しいトピックを追加する手順:
  1. このディレクトリに新しい .py ファイルを作成し TOPIC dict を定義する。
  2. ALL_TOPICS にその TOPIC を追加する。
"""

from __future__ import annotations

from app.services.prompts.topics import (
    cmy_primary as _cmy,
    hsb_space as _hsb,
    hsl_space as _hsl,
    lab_space as _lab,
    rgb_primary as _rgb,
)

ALL_TOPICS: list[dict] = [
    _rgb.TOPIC,
    _cmy.TOPIC,
    _hsb.TOPIC,
    _hsl.TOPIC,
    _lab.TOPIC,
]


def _skip_label(prob: float, language: str) -> str:
    if prob == 0.0:
        return "必ず言う" if language == "ja" else "always say"
    if language == "ja":
        tenths = int(prob * 10)
        return f"{tenths}割の確率でスキップ（スキップの場合は一切言わない）"
    return f"skip {int(prob * 100)}% of the time (omit entirely if skipping)"


def _format_s2_options(options: list[str], language: str) -> str:
    return "\n".join(f'  - "{opt}"' for opt in options)


def _format_s3_options(options: list[dict], language: str) -> str:
    lines = []
    for opt in options:
        text = opt["text"]
        leads_to = opt.get("leads_to")
        if leads_to:
            if language == "ja":
                suffix = f' → ユーザーが同意したら次のターンで SHOW_CONTENT("{leads_to}") を呼ぶ'
            else:
                suffix = f' → if user agrees, call SHOW_CONTENT("{leads_to}") in the next turn'
            lines.append(f'  - "{text}"{suffix}')
        else:
            lines.append(f'  - "{text}"')
    return "\n".join(lines)


def _format_topic(topic: dict, language: str) -> str:
    s1 = topic["s1"][language]
    s2 = topic["s2"]
    s3 = topic["s3"]

    s2_label = _skip_label(s2["skip_probability"], language)
    s3_label = _skip_label(s3["skip_probability"], language)
    s2_opts = _format_s2_options(s2["options"][language], language)
    s3_opts = _format_s3_options(s3["options"][language], language)

    if language == "ja":
        return (
            f"### {topic['id']}\n"
            f"文1（必ず言う）: \"{s1}\"\n"
            f"文2（{s2_label}。言うなら以下から1つ自然に選ぶ）:\n{s2_opts}\n"
            f"文3（{s3_label}。言うなら以下から1つ自然に選ぶ）:\n{s3_opts}"
        )
    return (
        f"### {topic['id']}\n"
        f"Sentence 1 (always say): \"{s1}\"\n"
        f"Sentence 2 ({s2_label}, choose ONE naturally):\n{s2_opts}\n"
        f"Sentence 3 ({s3_label}, choose ONE naturally):\n{s3_opts}"
    )


def build_topic_scripts_section(language: str) -> str:
    topic_blocks = "\n\n".join(_format_topic(t, language) for t in ALL_TOPICS)

    if language == "ja":
        header = """\
## 教育スライド スクリプトガイド

トピックについて質問された、または SHOW_CONTENT を呼んだとき:
1. まず SHOW_CONTENT を呼ぶ（未呼び出しなら）。
2. 文1・文2・文3を**1回の連続した発話**としてすべて話す（文1だけで終わらない）。
3. 文1→文2→文3の順で自然につなげる。

ルール:
- 文1は必ず言う。文2・文3は指定の確率でスキップ（スキップ時は完全に省く）。
- 選択肢は状況に合わせて1つ選ぶ（選んだことは宣言しない）。
- 文3でleads_toのある選択肢を選んだ場合: 口頭で提案し、ユーザーが同意したら次のターンでSHOW_CONTENTを呼ぶ。

"""
    else:
        header = """\
## Educational slide speaking scripts

When asked about a topic, or after calling SHOW_CONTENT:
1. Call SHOW_CONTENT first (if not already shown).
2. Deliver sentences 1, 2, 3 as **one continuous response** — do not stop after sentence 1.
3. Follow the s1→s2→s3 order, connecting them naturally.

Rules:
- Sentence 1 is always said. Sentences 2/3 are skipped at the stated probability (omit entirely if skipping).
- Choose options naturally; do not announce your choice.
- For s3 options with leads_to: propose it verbally; if the user agrees, call SHOW_CONTENT next turn.

"""

    return header + topic_blocks
