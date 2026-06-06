"""
色データの読み込みと検索を提供するサービス
"""
import json
from pathlib import Path
from typing import List, Optional, Dict
from app.api.schemas.colors import ColorItem, ColorSearchResponse

class ColorService:
    """色データを管理・検索するサービス"""
    
    def __init__(self):
        self._colors: List[ColorItem] = []
        self._load_colors()
    
    def _load_colors(self):
        """sample_colors.jsonから色データを読み込む"""
        colors_file = Path(__file__).parent.parent / "data" / "sample_colors.json"
        
        if not colors_file.exists():
            raise FileNotFoundError(f"Color data file not found: {colors_file}")
        
        with open(colors_file, 'r', encoding='utf-8') as f:
            raw_colors = json.load(f)
        
        # RGB値を計算してColorItemに変換
        self._colors = []
        for color_data in raw_colors:
            rgb = self._hex_to_rgb(color_data['hex'])
            color_item = ColorItem(
                hex=color_data['hex'],
                name1=color_data['name1'],
                name2=color_data['name2'],
                name3=color_data['name3'],
                tag=color_data['tag'],
                rgb=rgb
            )
            self._colors.append(color_item)
    
    def _hex_to_rgb(self, hex_code: str) -> dict:
        """HEXコードをRGBに変換"""
        hex_code = hex_code.lstrip('#')
        if len(hex_code) != 6:
            raise ValueError(f"Invalid hex code: {hex_code}")
        r = int(hex_code[0:2], 16)
        g = int(hex_code[2:4], 16)
        b = int(hex_code[4:6], 16)
        return {"r": r, "g": g, "b": b}
    
    def search(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> ColorSearchResponse:
        """色を検索"""
        results = self._colors.copy()
        
        # タグでフィルタリング
        if tags:
            results = [c for c in results if any(tag in c.tag for tag in tags)]
        
        # クエリで検索
        if query:
            query_lower = query.lower().strip()
            filtered = []
            for color in results:
                # HEXコードで完全一致
                hex_normalized = color.hex.lower().lstrip('#')
                query_normalized = query_lower.lstrip('#')
                if hex_normalized == query_normalized or color.hex.lower() == query_lower:
                    filtered.append(color)
                    continue
                
                # 色名で部分一致
                if (query_lower in color.name1.lower() or
                    (color.name2 and query_lower in color.name2.lower()) or
                    (color.name3 and query_lower in color.name3.lower())):
                    filtered.append(color)
            
            results = filtered
        
        total = len(results)
        paginated = results[offset:offset + limit]
        
        return ColorSearchResponse(
            results=paginated,
            total=total,
            limit=limit,
            offset=offset
        )
    
    def get_by_hex(self, hex_code: str) -> Optional[ColorItem]:
        """HEXコードで色を取得"""
        hex_code = hex_code.upper()
        if not hex_code.startswith('#'):
            hex_code = '#' + hex_code
        
        for color in self._colors:
            if color.hex.upper() == hex_code:
                return color
        return None
    
    def search_by_name(self, name: str) -> List[ColorItem]:
        """色名で検索（部分一致）。スペース正規化あり"""
        name_lower = name.lower().strip()
        name_nospace = name_lower.replace(" ", "").replace("　", "")
        results = []
        for color in self._colors:
            n1 = color.name1.lower()
            n1_nospace = n1.replace(" ", "")
            n2 = color.name2.lower() if color.name2 else ""
            n3 = color.name3.lower() if color.name3 else ""
            if (name_lower in n1 or name_nospace in n1_nospace or
                (n2 and (name_lower in n2 or name_nospace in n2.replace(" ", ""))) or
                (n3 and (name_lower in n3 or name_nospace in n3.replace(" ", "")))):
                results.append(color)
        return results
    
    def get_categories(self) -> Dict[str, int]:
        """カテゴリごとの件数を取得"""
        categories = {}
        for color in self._colors:
            for tag in color.tag:
                categories[tag] = categories.get(tag, 0) + 1
        return categories
    
    def get_all_colors(self) -> List[ColorItem]:
        """すべての色を取得（要約用）"""
        return self._colors
    
    def get_summary_for_prompt(self, max_colors_per_category: int = 10) -> str:
        """プロンプト用の要約を生成"""
        categories = self.get_categories()
        summary_parts = []
        
        for category, count in categories.items():
            category_colors = [c for c in self._colors if category in c.tag]
            # 各カテゴリから代表的な色を選択
            sample_colors = category_colors[:max_colors_per_category]
            
            color_names = [c.name1 for c in sample_colors]
            if count > max_colors_per_category:
                color_names.append(f"...他{count - max_colors_per_category}色")
            
            summary_parts.append(
                f"- {category}: {count}色（例: {', '.join(color_names)}）"
            )
        
        return "\n".join(summary_parts)
