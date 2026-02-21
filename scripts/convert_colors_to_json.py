#!/usr/bin/env python3
"""
sampleColors.jsをJSONに変換するスクリプト
"""
import json
import re
from pathlib import Path

def convert_js_to_json():
    """sampleColors.jsをJSONに変換"""
    project_root = Path(__file__).parent.parent
    js_file = project_root / "frontend" / "src" / "constants" / "sampleColors.js"
    output_file = project_root / "backend" / "app" / "data" / "sample_colors.json"
    
    # 出力ディレクトリを作成
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    if not js_file.exists():
        raise FileNotFoundError(f"Source file not found: {js_file}")
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    colors = []
    
    # 配列の内容部分を抽出（const sampleColors = [...] の [...] 部分）
    array_match = re.search(r'const\s+sampleColors\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if not array_match:
        raise ValueError("Could not find sampleColors array")
    
    array_content = array_match.group(1)
    
    # 各オブジェクトを抽出（{ ... } の形式）
    # ネストされた構造に対応するため、{ と } のバランスを取る
    object_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    
    for obj_match in re.finditer(object_pattern, array_content, re.DOTALL):
        obj_str = obj_match.group(0)
        
        # 各フィールドを抽出
        hex_match = re.search(r"hex:\s*'([^']+)'", obj_str)
        name1_match = re.search(r"name1:\s*'([^']*)'", obj_str)
        name2_match = re.search(r"name2:\s*'([^']*)'", obj_str)
        name3_match = re.search(r"name3:\s*'([^']*)'", obj_str)
        tag_match = re.search(r"tag:\s*\[([^\]]+)\]", obj_str)
        
        if hex_match and name1_match:
            hex_code = hex_match.group(1)
            name1 = name1_match.group(1)
            name2 = name2_match.group(1) if name2_match else ""
            name3 = name3_match.group(1) if name3_match else ""
            
            # タグを抽出
            tags = []
            if tag_match:
                tags_str = tag_match.group(1)
                tag_pattern = r"['\"]([^'\"]+)['\"]"
                for tag_match_item in re.finditer(tag_pattern, tags_str):
                    tags.append(tag_match_item.group(1))
            
            colors.append({
                "hex": hex_code,
                "name1": name1,
                "name2": name2,
                "name3": name3,
                "tag": tags
            })
    
    # JSONファイルに書き込み
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(colors, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Converted {len(colors)} colors to {output_file}")
    return len(colors)

if __name__ == "__main__":
    try:
        count = convert_js_to_json()
        print(f"✓ Successfully converted {count} colors")
    except Exception as e:
        print(f"✗ Error: {e}")
        exit(1)
