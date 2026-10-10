"""css_color トピック定義 — CSS Named Colors。

スライド（CssColor.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら CssColor.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "css_color",
    "s1": {
        "ja": (
            "CSS Named Colorsは、ウェブページの色を、英語の名前で指定できるようにした色のセットで、約140色あります。"
            "redやblueのような基本の色から、tomato、skyblue、goldのような、身近なものにちなんだ名前まであります。"
            "HEXコードより覚えやすく、コードも読みやすくなります。"
            "ただし、歴史的な経緯から、darkgrayがgrayより明るいといった、ちぐはぐな名前もあります。"
            "このアプリのColor Samplesで、すべての色を表示できます。"
        ),
        "en": (
            "CSS Named Colors are a set of about 140 colors that web pages can specify by English name. "
            "They range from basic colors like red and blue to names taken from familiar things, like tomato, skyblue and gold. "
            "They are easier to remember than HEX codes and make code easier to read. "
            "But for historical reasons, some names are inconsistent: darkgray, for example, is lighter than gray. "
            "This app's Color Samples can show all of them."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
