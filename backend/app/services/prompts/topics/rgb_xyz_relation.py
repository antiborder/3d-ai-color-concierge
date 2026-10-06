"""rgb_xyz_relation トピック定義 — RGB座標とXYZ座標の関係。

スライド（RgbXyzRelation.tsx）はこの s1 の進行に合わせて段階的に描画される。
文を変えたら RgbXyzRelation.tsx の STEP / STEP_AT_MS も合わせること。
"""

from __future__ import annotations

TOPIC: dict = {
    "id": "rgb_xyz_relation",
    "s1": {
        "ja": (
            "RGBとXYZは、決まった計算で互いに変換できます。"
            "XYZは、等色実験のRGBの曲線で赤がマイナスになる部分を、軸を組み替えてなくすために作られました。"
            "画面のRGBも、光の強さに直してから決まった割合で足し合わせると、XYZになります。"
            "赤・緑・青は、XYZの中ではこの3本の矢印になり、RGBの立方体は斜めにゆがんだ箱になります。"
            "Yの行を見ると、明るさには緑が一番効くことが分かります。"
        ),
        "en": (
            "RGB and XYZ convert into each other with a fixed calculation. "
            "XYZ was made by rearranging the axes to get rid of the part where red goes negative "
            "in the RGB curves from color matching experiments. "
            "A screen's RGB, too, becomes XYZ once its values are turned into amounts of light "
            "and added up in fixed proportions. "
            "Red, green and blue become these three arrows in XYZ, "
            "and the RGB cube becomes a slanted, skewed box. "
            "The Y row shows that green contributes the most to brightness."
        ),
    },
    # スライドの描画が s1 と同期しているので、追加の文は言わない
    "s2": {
        "skip_probability": 1.0,
        "options": {"ja": [], "en": []},
    },
}
