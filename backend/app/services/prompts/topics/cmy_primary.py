"""cmy_primary トピック定義 — 色材の三原色と減法混色。

スライド（CmyPrimary.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら CmyPrimary.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "cmy_primary",
    "s1": {
        "ja": (
            "色材の三原色は、シアン・マゼンタ・イエローの3色です。"
            "色材は重ねるほど暗くなり、シアンとマゼンタで青、マゼンタとイエローで赤、"
            "イエローとシアンで緑、3色全部で黒に近くなります。"
            "色材は光の一部を吸収するので、例えばシアンのインクは赤い光を吸収し、"
            "残った緑と青の光が目に届きます。"
        ),
        "en": (
            "The three primary colors of pigment are cyan, magenta and yellow. "
            "Pigments get darker as you layer them: cyan and magenta make blue, "
            "magenta and yellow make red, yellow and cyan make green, "
            "and all three come close to black. "
            "Pigments absorb part of the light: cyan ink, for example, absorbs red light, "
            "and the green and blue light that is left reaches your eyes."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
