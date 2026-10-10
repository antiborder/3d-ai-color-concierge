"""japanese_traditional_colors トピック定義 — 日本の伝統色。

スライド（JapaneseTraditionalColors.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら JapaneseTraditionalColors.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "japanese_traditional_colors",
    "s1": {
        "ja": (
            "日本の伝統色は、昔から日本で使われてきた色に、自然や暮らしにちなんだ名前を付けたものです。"
            "桜色、萌葱色、藍色、茜色、山吹色のように、花や植物、染料の名前が多く使われています。"
            "淡くくすんだ、落ち着いた色が多いのも特徴です。"
            "このアプリでは、約460色を表示できます。"
        ),
        "en": (
            "Japanese traditional colors are colors used in Japan since long ago, named after nature and daily life. "
            "Like sakura-iro, moegi-iro, ai-iro, akane-iro and yamabuki-iro, many are named after flowers, plants and dyes. "
            "Many of them are also soft, muted and calm. "
            "This app can show about 460 of them."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
