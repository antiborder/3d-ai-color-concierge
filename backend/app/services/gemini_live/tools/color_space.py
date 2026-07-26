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
- ユーザーの発話がUI操作（色変更/明度・彩度・色相調整/色空間変更）に該当する場合は、必ず tool call を使ってください。
- CHANGE_SHAPE を呼び出すと画面の表示が自動的に切り替わります。
  「〜を表示します」「〜に切り替えます」「表示してみますか？」のような文言は絶対に言わないこと。
  tool call を呼んだ後、すぐに内容の説明を始めること。
- CIE色度図・色度・馬蹄形に関する質問では CHANGE_SHAPE("xy") を呼び、以下の内容を音声で説明してください：
  「CIE色度図は、３次元の色空間を明るさ方向を潰して二次元に射影した図です。
  色度図の三角形の内側が赤・緑・青の三原色の組み合わせによりディスプレイ上で再現できる色です。
  三角形の外側はディスプレイ上で再現できない色です。」
- HSB色空間・HSV・色相/彩度/明度（Brightness）に関する質問では CHANGE_SHAPE("HSB") と SHOW_CONTENT("hsb_space") を両方呼び出し、以下の内容を音声で説明してください：
  「HSBは色相・彩度・明度の3軸で色を表現します。
  色相はカラーホイール上の角度、彩度は色の鮮やかさ、明度は色の明るさです。」
- HSL色空間・色相/彩度/輝度（Lightness）に関する質問では CHANGE_SHAPE("HSL") と SHOW_CONTENT("hsl_space") を両方呼び出し、以下の内容を音声で説明してください：
  「HSLは色相・彩度・輝度の3軸で色を表現します。
  輝度が0.5のとき最も鮮やかな色になり、0で黒、1で白になります。」
- Lab色空間・CIE Lab・L*a*b*に関する質問では CHANGE_SHAPE("Lab") と SHOW_CONTENT("lab_space") を両方呼び出し、以下の内容を音声で説明してください：
  「Labは明度L*と、赤-緑方向のa*、青-黄方向のb*の3軸で色を表現します。
  人間の視覚に基づいて設計されており、Lab上での距離が知覚的な色の差に対応します。」
- XYZ色空間・CIE XYZに関する質問では CHANGE_SHAPE("XYZ") を呼び出し、以下の内容を音声で説明してください：
  「XYZ色空間は、人が光を認知する仕組みを元に考案された色空間です。
  XYZ空間はディスプレイで再現できない色も含んでいます。
  XYZ空間をxy平面に射影するとCIE色度図になります。みてみますか？」
- LMS色空間・錐体細胞の応答に関する質問では CHANGE_SHAPE("LMS") と SHOW_CONTENT("oklch_lineage") を両方呼び出し、以下の内容を音声で説明してください：
  「LMSは人間の目の錐体細胞の応答を表した色空間です。
  L（長波長・赤）・M（中波長・緑）・S（短波長・青）の3成分で、XYZからOkLabへの中間ステップです。」
- OkLab色空間に関する質問では CHANGE_SHAPE("OKLAB") と SHOW_CONTENT("oklab_space") を両方呼び出し、以下の内容を音声で説明してください：
  「OkLabは2020年にBjörn Ottossonが提案した知覚的に均等な色空間です。
  LMSの立方根（cbrt）を取った後、行列変換でL・a・bを求めます。
  Lは明度、aは赤-緑軸、bは青-黄軸で、OkLab上の距離が知覚的な色差に対応します。」
- OkLCH・OkLabに関する概念的な質問（例：「OkLCHとは何ですか」）では CHANGE_SHAPE("OKLCH") と SHOW_CONTENT("oklch_lineage") を両方呼び出し、以下の内容を音声で説明してください：
  「OkLCHはBjörn Ottossonが2020年に提案した知覚的に均等な色空間です。
  RGBからXYZ、Lab、LCHと進化した色空間の最新版で、色相回転のズレを解消しています。」
- OkLCHとLCHの比較・違いに関する質問（例：「なぜOkLCHの方が優れているのですか」）では CHANGE_SHAPE("OKLCH") と SHOW_CONTENT("oklch_vs_lch") を両方呼び出し、以下の内容を音声で説明してください：
  「OkLCHでは色相を均等に変化させたとき、明度も均等に見えます。
  CIE LCHでは色相によって知覚的な明度がばらつく問題がありましたが、OkLCHはそれを解消しています。」\
"""

RULES_EN = """\
- If the user asks to change color / adjust brightness/saturation/hue / change color space, you MUST use a tool call.
- CHANGE_SHAPE automatically updates the display — do NOT say phrases like "let me show you", "I'll switch to", or "shall I display". Call the tool, then immediately begin the explanation.
- When asked about the CIE chromaticity diagram, call CHANGE_SHAPE("xy") and explain:
  "The CIE chromaticity diagram is a 2D projection of the 3D color space that ignores the lightness axis.
  Colors inside the triangle can be reproduced on a display using combinations of red, green, and blue.
  Colors outside the triangle cannot be reproduced on a display."
- When asked about the HSB (HSV) color space, call both CHANGE_SHAPE("HSB") and SHOW_CONTENT("hsb_space"), then explain:
  "HSB expresses color using three axes: Hue, Saturation, and Brightness.
  Hue is an angle on a color wheel, Saturation is vividness, and Brightness is lightness."
- When asked about the HSL color space, call both CHANGE_SHAPE("HSL") and SHOW_CONTENT("hsl_space"), then explain:
  "HSL expresses color using Hue, Saturation, and Lightness.
  At Lightness 0.5 colors are most vivid; Lightness 0 is black and Lightness 1 is white."
- When asked about the Lab color space or CIE L*a*b*, call both CHANGE_SHAPE("Lab") and SHOW_CONTENT("lab_space"), then explain:
  "Lab expresses color using L* for lightness, a* for the red-green axis, and b* for the blue-yellow axis.
  It is designed around human visual perception, so equal distances in Lab correspond to equal perceived color differences."
- When asked about the XYZ color space or CIE XYZ, call CHANGE_SHAPE("XYZ") and explain:
  "The CIE XYZ color space was designed based on how humans perceive light.
  XYZ includes colors that cannot be reproduced on any display.
  Projecting the XYZ space onto the xy plane gives you the CIE chromaticity diagram. Would you like to see it?"
- When asked about LMS color space or cone cell responses, call both CHANGE_SHAPE("LMS") and SHOW_CONTENT("oklch_lineage"), then explain:
  "LMS represents the response of the three cone cell types in the human eye.
  L is long-wavelength (red), M is medium-wavelength (green), S is short-wavelength (blue).
  It sits between XYZ and OkLab — OkLab applies a cube root and linear mix to LMS to achieve perceptual uniformity."
- When asked about the OkLab color space, call both CHANGE_SHAPE("OKLAB") and SHOW_CONTENT("oklab_space"), then explain:
  "OkLab is a perceptually uniform color space proposed by Björn Ottosson in 2020.
  It is computed by taking the cube root of the LMS cone responses, then applying a linear mix.
  L is lightness, a is the red-green axis, and b is the blue-yellow axis. Equal distances in OkLab correspond to equal perceived color differences."
- When asked conceptual questions about OkLCH or OkLab (e.g., "what is OkLCH"), call both CHANGE_SHAPE("OKLCH") and SHOW_CONTENT("oklch_lineage"), then explain:
  "OkLCH is a perceptually uniform color space proposed by Björn Ottosson in 2020.
  It is the latest evolution from RGB → XYZ → Lab → LCH, fixing hue rotation artifacts."
- When asked comparison questions about OkLCH vs LCH (e.g., "why is OkLCH better"), call both CHANGE_SHAPE("OKLCH") and SHOW_CONTENT("oklch_vs_lch"), then explain:
  "In OkLCH, equal hue steps look equally bright, which is not the case in CIE LCH.
  OkLCH fixes the uneven perceived lightness that varies with hue in standard LCH."\
"""
