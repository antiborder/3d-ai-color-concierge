"""
色データのスキーマ定義
"""

from pydantic import BaseModel


class ColorItem(BaseModel):
    """色データの1件"""

    hex: str
    name1: str
    name2: str
    name3: str
    tag: list[str]
    rgb: dict | None = None  # {"r": 255, "g": 0, "b": 0}


class ColorSearchResponse(BaseModel):
    """検索レスポンス"""

    results: list[ColorItem]
    total: int
    limit: int
    offset: int


class CategoryResponse(BaseModel):
    """カテゴリ情報レスポンス"""

    categories: dict  # {"CSS": 150, "MATERIAL": 500, "JAPANESE": 205}
