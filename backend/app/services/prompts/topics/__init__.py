"""教育トピックのスクリプト（SHOW_CONTENT の tool response で Gemini に渡す）。

スクリプトがあるトピック:
  文1（s1）は必ず言う。文2（s2）は skip_probability の確率で省き、言う場合は options から1つ選ぶ。
スクリプトがないトピック（タイトルのみのプレースホルダースライド）:
  Gemini が自分の知識で2文程度で説明する。

新しいトピックのスクリプトを追加する手順:
  1. このディレクトリに新しい .py ファイルを作成し TOPIC dict を定義する。
  2. _TOPIC_MODULES にそのモジュールを追加する。
"""

from __future__ import annotations

import random

from app.services.prompts.topics import (
    blue_green_cyan as _blue_green_cyan,
)
from app.services.prompts.topics import (
    brightness as _brightness,
)
from app.services.prompts.topics import (
    chromaticity_diagram as _chromaticity_diagram,
)
from app.services.prompts.topics import (
    cmy_primary as _cmy,
)
from app.services.prompts.topics import (
    cmyk_space as _cmyk_space,
)
from app.services.prompts.topics import (
    color_matching_experiment as _color_matching_experiment,
)
from app.services.prompts.topics import (
    cone_cells as _cone_cells,
)
from app.services.prompts.topics import (
    display_gamut as _display_gamut,
)
from app.services.prompts.topics import (
    electromagnetic_wave as _electromagnetic_wave,
)
from app.services.prompts.topics import (
    hex_code as _hex_code,
)
from app.services.prompts.topics import (
    hsb_space as _hsb,
)
from app.services.prompts.topics import (
    hsb_vs_hsl as _hsb_vs_hsl,
)
from app.services.prompts.topics import (
    hsl_space as _hsl,
)
from app.services.prompts.topics import (
    lab_space as _lab,
)
from app.services.prompts.topics import (
    light_pigment_primary_relation as _light_pigment_primary_relation,
)
from app.services.prompts.topics import (
    lightness as _lightness,
)
from app.services.prompts.topics import (
    light_visible_reason as _light_visible_reason,
)
from app.services.prompts.topics import (
    nature_of_light as _nature_of_light,
)
from app.services.prompts.topics import (
    oklch_lineage as _oklch_lineage,
)
from app.services.prompts.topics import (
    oklch_vs_lch as _oklch_vs_lch,
)
from app.services.prompts.topics import (
    rainbow_mechanism as _rainbow_mechanism,
)
from app.services.prompts.topics import (
    magenta_not_in_rainbow as _magenta_not_in_rainbow,
)
from app.services.prompts.topics import (
    red_green_yellow as _red_green_yellow,
)
from app.services.prompts.topics import (
    rgb_primary as _rgb,
)
from app.services.prompts.topics import (
    rgb_space as _rgb_space,
)
from app.services.prompts.topics import (
    rgb_xyz_relation as _rgb_xyz_relation,
)
from app.services.prompts.topics import (
    screen_mechanism as _screen_mechanism,
)
from app.services.prompts.topics import (
    sky_blue_reason as _sky_blue_reason,
)
from app.services.prompts.topics import (
    sunset_red_reason as _sunset_red_reason,
)
from app.services.prompts.topics import (
    visible_gamut as _visible_gamut,
)
from app.services.prompts.topics import (
    xyz_lms_relation as _xyz_lms_relation,
)
from app.services.prompts.topics import (
    xyz_space as _xyz,
)

_TOPIC_MODULES = [
    _rgb,
    _cmy,
    _hsb,
    _hsl,
    _lab,
    _xyz,
    _oklch_lineage,
    _oklch_vs_lch,
    _light_visible_reason,
    _cone_cells,
    _magenta_not_in_rainbow,
    _blue_green_cyan,
    _red_green_yellow,
    _rainbow_mechanism,
    _nature_of_light,
    _electromagnetic_wave,
    _sky_blue_reason,
    _sunset_red_reason,
    _color_matching_experiment,
    _rgb_space,
    _hsb_vs_hsl,
    _light_pigment_primary_relation,
    _cmyk_space,
    _hex_code,
    _screen_mechanism,
    _xyz_lms_relation,
    _rgb_xyz_relation,
    _brightness,
    _lightness,
    _chromaticity_diagram,
    _display_gamut,
    _visible_gamut,
]

TOPICS: dict[str, dict] = {m.TOPIC["id"]: m.TOPIC for m in _TOPIC_MODULES}


def topic_script(content_id: str, language: str, rng: random.Random | None = None) -> dict | None:
    """content_id の発話スクリプトを返す。スクリプトがなければ None。

    s2 を言うかどうかと、どの選択肢を使うかはここで決める（LLM には選ばせない）。
    """
    topic = TOPICS.get(content_id)
    if topic is None:
        return None
    r = rng or random
    s2_def = topic["s2"]
    s2 = None
    if r.random() >= s2_def["skip_probability"]:
        s2 = r.choice(s2_def["options"][language])
    return {"s1": topic["s1"][language], "s2": s2}
