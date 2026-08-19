"""CHANGE_SHAPE — 色空間 / UIシェイプ切り替えツール。"""

from __future__ import annotations

DECLARATIONS: list[dict] = [
    {
        "name": "CHANGE_SHAPE",
        "description": (
            "Switch color space / UI shape. "
            "Available: RGB, CMYK, HSL, HSB, Lab (CIE Lab), LCH, OKLCH (OkLCH — perceptually uniform LCH), "
            "LMS (cone cell responses — intermediate step toward OkLab), "
            "XYZ, xyz (CIE xyz chromaticity 3D), xy (CIE xy chromaticity 2D). "
            "Use 'xy' when the user asks about the CIE chromaticity diagram — it projects the 3D color space "
            "onto the 2D horseshoe shape by ignoring the lightness axis."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "colorSpace": {
                    "type": "string",
                    "enum": ["RGB", "CMYK", "HSL", "HSB", "Lab", "LCH", "OKLAB", "OKLCH", "LMS", "XYZ", "xyz", "xy"],
                }
            },
            "required": ["colorSpace"],
        },
    },
]


def _change_shape(args: dict) -> dict:
    return {"colorSpace": args.get("colorSpace")}


COMMANDS: dict[str, object] = {
    "CHANGE_SHAPE": _change_shape,
}

RULES_JA = """\
- UI操作（色変更/明度・彩度・色相調整/色空間変更）に該当する発話には必ず tool call を使う。
- CHANGE_SHAPE を呼ぶと画面表示が自動的に切り替わる。「〜を表示します」「切り替えます」等は言わず、呼んだ直後に説明を始める。
- CIE色度図・色度・馬蹄形の質問 → CHANGE_SHAPE("xy")、以下を説明：
  「CIE色度図は、3次元の色空間を明るさ方向に潰して2次元に射影した図です。三角形の内側が赤・緑・青の組み合わせでディスプレイ上に再現できる色、外側は再現できない色です。」
- HSB・HSV・色相/彩度/明度の質問 → CHANGE_SHAPE("HSB") + SHOW_CONTENT("hsb_space")、以下を説明：
  「HSBは色相・彩度・明度の3軸で色を表現します。色相はカラーホイール上の角度、彩度は鮮やかさ、明度は明るさです。」
- HSL・色相/彩度/輝度の質問 → CHANGE_SHAPE("HSL") + SHOW_CONTENT("hsl_space")、以下を説明：
  「HSLは色相・彩度・輝度の3軸で色を表現します。輝度0.5で最も鮮やかになり、0で黒、1で白になります。」
- Lab・CIE Lab・L*a*b*の質問 → CHANGE_SHAPE("Lab") + SHOW_CONTENT("lab_space")、以下を説明：
  「Labは明度L*、赤-緑方向のa*、青-黄方向のb*の3軸で色を表現します。人間の視覚に基づいており、Lab上の距離が知覚的な色差に対応します。」
- XYZ・CIE XYZの質問 → CHANGE_SHAPE("XYZ")、以下を説明：
  「XYZ色空間は人が光を認知する仕組みを元にした色空間で、ディスプレイで再現できない色も含みます。xy平面に射影するとCIE色度図になります。みてみますか？」
- LMS・錐体細胞の応答の質問 → CHANGE_SHAPE("LMS") + SHOW_CONTENT("oklch_lineage")、以下を説明：
  「LMSは目の錐体細胞の応答を表す色空間です。L（長波長・赤）・M（中波長・緑）・S（短波長・青）の3成分で、XYZからOkLabへの中間ステップです。」
- OkLabの質問 → CHANGE_SHAPE("OKLAB") + SHOW_CONTENT("oklab_space")、以下を説明：
  「OkLabは2020年にBjörn Ottossonが提案した知覚的に均等な色空間です。LMSの立方根を取り行列変換でL・a・bを求めます。Lは明度、aは赤-緑軸、bは青-黄軸で、距離が知覚的な色差に対応します。」
- OkLCH・OkLabの概念的な質問（例「OkLCHとは」）→ CHANGE_SHAPE("OKLCH") + SHOW_CONTENT("oklch_lineage")、以下を説明：
  「OkLCHはBjörn Ottossonが2020年に提案した知覚的に均等な色空間です。RGB→XYZ→Lab→LCHと進化した最新版で、色相回転のズレを解消しています。」
- OkLCHとLCHの比較の質問（例「なぜOkLCHが優れているか」）→ CHANGE_SHAPE("OKLCH") + SHOW_CONTENT("oklch_vs_lch")、以下を説明：
  「OkLCHでは色相を均等に変化させても明度が均等に見えます。CIE LCHにあった色相による知覚的明度のばらつきを解消しています。」\
"""

RULES_EN = """\
- If the user asks to change color / adjust brightness/saturation/hue / change color space, you MUST use a tool call.
- CHANGE_SHAPE updates the display automatically — do NOT say "let me show you" or "I'll switch to". Call the tool, then immediately explain.
- CIE chromaticity diagram question → CHANGE_SHAPE("xy"), explain:
  "The CIE chromaticity diagram is a 2D projection of the 3D color space that ignores the lightness axis. Colors inside the triangle can be reproduced on a display using red, green, and blue; colors outside cannot."
- HSB (HSV) question → CHANGE_SHAPE("HSB") + SHOW_CONTENT("hsb_space"), explain:
  "HSB expresses color using Hue, Saturation, and Brightness. Hue is an angle on a color wheel, Saturation is vividness, Brightness is lightness."
- HSL question → CHANGE_SHAPE("HSL") + SHOW_CONTENT("hsl_space"), explain:
  "HSL expresses color using Hue, Saturation, and Lightness. At Lightness 0.5 colors are most vivid; 0 is black, 1 is white."
- Lab / CIE L*a*b* question → CHANGE_SHAPE("Lab") + SHOW_CONTENT("lab_space"), explain:
  "Lab expresses color using L* for lightness, a* for red-green, and b* for blue-yellow. It's designed around human perception, so equal distances correspond to equal perceived color differences."
- XYZ / CIE XYZ question → CHANGE_SHAPE("XYZ"), explain:
  "CIE XYZ was designed based on how humans perceive light, and includes colors no display can reproduce. Projecting it onto the xy plane gives the CIE chromaticity diagram. Would you like to see it?"
- LMS / cone cell response question → CHANGE_SHAPE("LMS") + SHOW_CONTENT("oklch_lineage"), explain:
  "LMS represents the response of the eye's three cone types — L (long/red), M (medium/green), S (short/blue). It sits between XYZ and OkLab, which applies a cube root and linear mix to LMS for perceptual uniformity."
- OkLab question → CHANGE_SHAPE("OKLAB") + SHOW_CONTENT("oklab_space"), explain:
  "OkLab is a perceptually uniform color space proposed by Björn Ottosson in 2020, computed by taking the cube root of LMS and applying a linear mix. L is lightness, a is red-green, b is blue-yellow; equal distances correspond to equal perceived differences."
- OkLCH/OkLab conceptual question (e.g. "what is OkLCH") → CHANGE_SHAPE("OKLCH") + SHOW_CONTENT("oklch_lineage"), explain:
  "OkLCH is a perceptually uniform color space proposed by Björn Ottosson in 2020 — the latest evolution from RGB → XYZ → Lab → LCH, fixing hue rotation artifacts."
- OkLCH vs LCH comparison question (e.g. "why is OkLCH better") → CHANGE_SHAPE("OKLCH") + SHOW_CONTENT("oklch_vs_lch"), explain:
  "In OkLCH, equal hue steps look equally bright — unlike CIE LCH, where perceived lightness varies unevenly with hue."\
"""
