#!/usr/bin/env python3
"""Generate Munsell Color Tree entries for sample_colors.json"""
import json
import numpy as np
import warnings
warnings.filterwarnings('ignore')
import colour

HUE_FAMILIES = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP']
HUE_PREFIXES = [5.0]  # principal hues only (Munsell Book of Color)
HUE_NAMES = {
    'R': 'Red', 'YR': 'Yellow-Red', 'Y': 'Yellow', 'GY': 'Green-Yellow',
    'G': 'Green', 'BG': 'Blue-Green', 'B': 'Blue', 'PB': 'Purple-Blue',
    'P': 'Purple', 'RP': 'Red-Purple'
}

HUES = []
for family in HUE_FAMILIES:
    for prefix in HUE_PREFIXES:
        HUES.append((prefix, family))

VALUES = list(range(1, 10))    # 1–9 (all integer values)
CHROMAS = list(range(2, 22, 2))  # 2, 4, 6, … 20 (all even steps)

def munsell_to_hex(notation):
    try:
        xyY = colour.munsell_colour_to_xyY(notation)
        XYZ = colour.xyY_to_XYZ(xyY)
        RGB = colour.XYZ_to_sRGB(XYZ)
        RGB = np.clip(RGB, 0, 1)
        r, g, b = (int(x * 255 + 0.5) for x in RGB)
        return f"#{r:02X}{g:02X}{b:02X}"
    except Exception:
        return None

colors = []

# Chromatic hues
for prefix, family in HUES:
    hue_str = f"{prefix:g}{family}"
    descriptive = HUE_NAMES[family]
    for v in VALUES:
        for c in CHROMAS:
            notation = f"{hue_str} {v}/{c}"
            hex_val = munsell_to_hex(notation)
            if hex_val:
                colors.append({
                    "hex": hex_val,
                    "name1": notation,
                    "name2": descriptive,
                    "name3": "",
                    "tag": ["MUNSELL"]
                })

# Neutral grays: N1/–N9/
for v in range(1, 10):
    notation = f"N{v}/"
    hex_val = munsell_to_hex(notation)
    if hex_val:
        colors.append({
            "hex": hex_val,
            "name1": f"N {v}/",
            "name2": "Neutral",
            "name3": "",
            "tag": ["MUNSELL"]
        })

print(json.dumps(colors, ensure_ascii=False, indent=2))
print(f"# Total: {len(colors)} Munsell colors", flush=True)
