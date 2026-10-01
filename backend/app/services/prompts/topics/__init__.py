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
    cmy_primary as _cmy,
)
from app.services.prompts.topics import (
    hsb_space as _hsb,
)
from app.services.prompts.topics import (
    hsl_space as _hsl,
)
from app.services.prompts.topics import (
    lab_space as _lab,
)
from app.services.prompts.topics import (
    light_visible_reason as _light_visible_reason,
)
from app.services.prompts.topics import (
    oklch_lineage as _oklch_lineage,
)
from app.services.prompts.topics import (
    oklch_vs_lch as _oklch_vs_lch,
)
from app.services.prompts.topics import (
    rgb_primary as _rgb,
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
