"""RGB変換ユーティリティ（tool_call_to_frontend_command の内部で使用）。"""

from __future__ import annotations


def rgb_to_cmyk(r: int, g: int, b: int) -> tuple[float, float, float, float]:
    if r == 0 and g == 0 and b == 0:
        return (0.0, 0.0, 0.0, 100.0)
    r_norm, g_norm, b_norm = r / 255.0, g / 255.0, b / 255.0
    k = 1.0 - max(r_norm, g_norm, b_norm)
    if k == 1.0:
        return (0.0, 0.0, 0.0, 100.0)
    c = (1.0 - r_norm - k) / (1.0 - k)
    m = (1.0 - g_norm - k) / (1.0 - k)
    y = (1.0 - b_norm - k) / (1.0 - k)
    return (c * 100.0, m * 100.0, y * 100.0, k * 100.0)


def rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    r_norm, g_norm, b_norm = r / 255.0, g / 255.0, b / 255.0
    max_val = max(r_norm, g_norm, b_norm)
    min_val = min(r_norm, g_norm, b_norm)
    delta = max_val - min_val
    lightness = (max_val + min_val) / 2.0
    if delta == 0:
        return (0.0, 0.0, lightness * 100.0)
    s = delta / (max_val + min_val) if lightness < 0.5 else delta / (2.0 - max_val - min_val)
    if max_val == r_norm:
        h = ((g_norm - b_norm) / delta) % 6.0
    elif max_val == g_norm:
        h = (b_norm - r_norm) / delta + 2.0
    else:
        h = (r_norm - g_norm) / delta + 4.0
    h *= 60.0
    if h < 0:
        h += 360.0
    return (h, s * 100.0, lightness * 100.0)


def determine_optimal_color_space(
    r: int, g: int, b: int, adjust_property: str | None = None
) -> str:
    if adjust_property in ("hue", "saturation", "brightness"):
        return "HSL"
    _, _, lightness = rgb_to_hsl(r, g, b)
    if lightness >= 90:
        return "HSL"
    threshold = 10
    non_zero = [ch for ch in [(r, "R"), (g, "G"), (b, "B")] if ch[0] > threshold]
    if len(non_zero) == 1:
        return "RGB"
    if (
        (r == 255 and g == 0 and b == 0)
        or (r == 0 and g == 255 and b == 0)
        or (r == 0 and g == 0 and b == 255)
    ):
        return "RGB"
    c, m, y, k = rgb_to_cmyk(r, g, b)
    cmyk_threshold = 5.0
    non_zero_cmyk = [val for val in [(c, "C"), (m, "M"), (y, "Y")] if val[0] > cmyk_threshold]
    if len(non_zero_cmyk) == 1 and k < cmyk_threshold:
        return "CMYK"
    if (
        (r == 0 and g == 255 and b == 255)
        or (r == 255 and g == 0 and b == 255)
        or (r == 255 and g == 255 and b == 0)
    ):
        return "CMYK"
    return "HSV"
