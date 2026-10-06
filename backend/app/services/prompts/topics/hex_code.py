"""hex_code トピック定義 — HEXコードとは。

スライド（HexCode.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら HexCode.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "hex_code",
    "s1": {
        "ja": (
            "HEXコードは、色をシャープと6桁の英数字で表す書き方です。"
            "2桁ずつ、赤・緑・青の強さを表します。"
            "1桁は0から9とAからFの16種類で、"
            "2桁で16かける16の256段階、つまり0から255を表せます。"
            "例えばこのコードでは、赤がFFで255、緑が80で128、青が00で0なので、オレンジになります。"
        ),
        "en": (
            "A HEX code writes a color as a hash sign followed by six letters and digits. "
            "Each pair of digits gives the strength of red, green and blue. "
            "One digit is one of 16 symbols, 0 to 9 and A to F, "
            "so two digits give 16 times 16, or 256 levels, which means 0 to 255. "
            "In this code, for example, red is FF, or 255, green is 80, or 128, "
            "and blue is 00, or 0, so it is orange."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
