"""
色データ検索APIエンドポイント
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.api.schemas.colors import (
    ColorSearchResponse,
    ColorItem,
    CategoryResponse
)
from app.services.color_service import ColorService

logger = logging.getLogger(__name__)
router = APIRouter()

# シングルトンインスタンス
_color_service: Optional[ColorService] = None

def get_color_service() -> ColorService:
    """ColorServiceのシングルトンインスタンスを取得"""
    global _color_service
    if _color_service is None:
        _color_service = ColorService()
    return _color_service

@router.get("/search", response_model=ColorSearchResponse)
async def search_colors(
    query: Optional[str] = Query(None, description="色名やHEXコードで検索"),
    tags: Optional[str] = Query(None, description="カンマ区切りでタグを指定 (CSS,MATERIAL,JAPANESE)"),
    limit: int = Query(50, ge=1, le=200, description="最大取得件数"),
    offset: int = Query(0, ge=0, description="オフセット")
):
    """
    色データを検索するエンドポイント
    
    - 色名（name1, name2, name3）での部分一致検索
    - HEXコードでの完全一致検索
    - タグでのフィルタリング
    """
    try:
        color_service = get_color_service()
        
        # タグをリストに変換
        tag_list = None
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        
        results = color_service.search(
            query=query,
            tags=tag_list,
            limit=limit,
            offset=offset
        )
        
        return results
    except Exception as e:
        logger.error(f"Error searching colors: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error searching colors: {str(e)}"
        )

@router.get("/by-hex/{hex_code}", response_model=ColorItem)
async def get_color_by_hex(hex_code: str):
    """
    HEXコードで色を取得
    
    - hex_code: HEXコード（#付きまたは#なし、大文字小文字問わず）
    """
    try:
        color_service = get_color_service()
        color = color_service.get_by_hex(hex_code)
        if not color:
            raise HTTPException(
                status_code=404,
                detail=f"Color not found for hex code: {hex_code}"
            )
        return color
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting color by hex: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error getting color: {str(e)}"
        )

@router.get("/by-name/{name}", response_model=List[ColorItem])
async def get_colors_by_name(name: str):
    """
    色名で色を検索（部分一致）
    
    - name: 検索する色名（部分一致）
    """
    try:
        color_service = get_color_service()
        colors = color_service.search_by_name(name)
        return colors
    except Exception as e:
        logger.error(f"Error searching colors by name: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error searching colors: {str(e)}"
        )

@router.get("/categories", response_model=CategoryResponse)
async def get_categories():
    """
    利用可能なカテゴリ（タグ）とその件数を取得
    """
    try:
        color_service = get_color_service()
        categories = color_service.get_categories()
        return CategoryResponse(categories=categories)
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error getting categories: {str(e)}"
        )
