"""
S-3: Unit tests for app/services/gemini_live/tools/_color_math.py

Functions under test:
  - rgb_to_cmyk(r, g, b) -> tuple[float, float, float, float]  (C, M, Y, K in 0–100)
  - rgb_to_hsl(r, g, b)  -> tuple[float, float, float]          (H deg, S %, L %)
  - determine_optimal_color_space(r, g, b, adjust_property) -> str
"""

import pytest

from app.services.gemini_live.tools._color_math import (
    determine_optimal_color_space,
    rgb_to_cmyk,
    rgb_to_hsl,
)

# ---------------------------------------------------------------------------
# rgb_to_cmyk
# ---------------------------------------------------------------------------


class TestRgbToCmyk:
    def test_pure_red(self):
        c, m, y, k = rgb_to_cmyk(255, 0, 0)
        assert c == pytest.approx(0.0, abs=0.1)
        assert m == pytest.approx(100.0, abs=0.1)
        assert y == pytest.approx(100.0, abs=0.1)
        assert k == pytest.approx(0.0, abs=0.1)

    def test_pure_black(self):
        c, m, y, k = rgb_to_cmyk(0, 0, 0)
        assert c == pytest.approx(0.0, abs=0.1)
        assert m == pytest.approx(0.0, abs=0.1)
        assert y == pytest.approx(0.0, abs=0.1)
        assert k == pytest.approx(100.0, abs=0.1)

    def test_pure_white(self):
        c, m, y, k = rgb_to_cmyk(255, 255, 255)
        assert c == pytest.approx(0.0, abs=0.1)
        assert m == pytest.approx(0.0, abs=0.1)
        assert y == pytest.approx(0.0, abs=0.1)
        assert k == pytest.approx(0.0, abs=0.1)

    def test_neutral_gray(self):
        # (128, 128, 128) -> CMY all ≈ 0, K ≈ 50
        c, m, y, k = rgb_to_cmyk(128, 128, 128)
        assert c == pytest.approx(0.0, abs=0.5)
        assert m == pytest.approx(0.0, abs=0.5)
        assert y == pytest.approx(0.0, abs=0.5)
        assert k == pytest.approx(49.8, abs=1.0)

    def test_pure_green(self):
        c, m, y, k = rgb_to_cmyk(0, 255, 0)
        assert c == pytest.approx(100.0, abs=0.1)
        assert m == pytest.approx(0.0, abs=0.1)
        assert y == pytest.approx(100.0, abs=0.1)
        assert k == pytest.approx(0.0, abs=0.1)

    def test_pure_blue(self):
        c, m, y, k = rgb_to_cmyk(0, 0, 255)
        assert c == pytest.approx(100.0, abs=0.1)
        assert m == pytest.approx(100.0, abs=0.1)
        assert y == pytest.approx(0.0, abs=0.1)
        assert k == pytest.approx(0.0, abs=0.1)

    def test_returns_four_floats(self):
        result = rgb_to_cmyk(100, 150, 200)
        assert len(result) == 4
        assert all(isinstance(v, float) for v in result)

    def test_values_in_range(self):
        for r, g, b in [(0, 128, 255), (64, 192, 32), (200, 50, 100)]:
            c, m, y, k = rgb_to_cmyk(r, g, b)
            for val in (c, m, y, k):
                assert 0.0 <= val <= 100.0, f"Out of range: {val}"


# ---------------------------------------------------------------------------
# rgb_to_hsl
# ---------------------------------------------------------------------------


class TestRgbToHsl:
    def test_pure_red(self):
        h, s, l = rgb_to_hsl(255, 0, 0)
        assert h == pytest.approx(0.0, abs=0.1)
        assert s == pytest.approx(100.0, abs=0.1)
        assert l == pytest.approx(50.0, abs=0.1)

    def test_pure_green(self):
        h, s, l = rgb_to_hsl(0, 255, 0)
        assert h == pytest.approx(120.0, abs=0.1)
        assert s == pytest.approx(100.0, abs=0.1)
        assert l == pytest.approx(50.0, abs=0.1)

    def test_pure_blue(self):
        h, s, l = rgb_to_hsl(0, 0, 255)
        assert h == pytest.approx(240.0, abs=0.1)
        assert s == pytest.approx(100.0, abs=0.1)
        assert l == pytest.approx(50.0, abs=0.1)

    def test_white(self):
        h, s, l = rgb_to_hsl(255, 255, 255)
        assert l == pytest.approx(100.0, abs=0.1)

    def test_black(self):
        h, s, l = rgb_to_hsl(0, 0, 0)
        assert l == pytest.approx(0.0, abs=0.1)

    def test_gray_has_zero_saturation(self):
        h, s, l = rgb_to_hsl(128, 128, 128)
        assert s == pytest.approx(0.0, abs=0.5)

    def test_cyan(self):
        # Cyan (0, 255, 255) -> H=180
        h, s, l = rgb_to_hsl(0, 255, 255)
        assert h == pytest.approx(180.0, abs=0.1)
        assert s == pytest.approx(100.0, abs=0.1)
        assert l == pytest.approx(50.0, abs=0.1)

    def test_returns_three_floats(self):
        result = rgb_to_hsl(100, 150, 200)
        assert len(result) == 3
        assert all(isinstance(v, float) for v in result)

    def test_hue_in_range(self):
        for r, g, b in [(255, 128, 0), (128, 0, 255), (0, 128, 64)]:
            h, s, l = rgb_to_hsl(r, g, b)
            assert 0.0 <= h < 360.0, f"Hue out of range: {h}"

    def test_saturation_and_lightness_in_range(self):
        for r, g, b in [(255, 100, 50), (10, 200, 180), (128, 64, 192)]:
            h, s, l = rgb_to_hsl(r, g, b)
            assert 0.0 <= s <= 100.0, f"Saturation out of range: {s}"
            assert 0.0 <= l <= 100.0, f"Lightness out of range: {l}"


# ---------------------------------------------------------------------------
# determine_optimal_color_space
# ---------------------------------------------------------------------------

_VALID_SPACES = {"RGB", "HSL", "HSV", "CMYK"}


class TestDetermineOptimalColorSpace:
    def test_returns_string_from_expected_set(self):
        result = determine_optimal_color_space(100, 150, 200)
        assert result in _VALID_SPACES

    def test_hue_property_returns_hsl(self):
        assert determine_optimal_color_space(200, 100, 50, "hue") == "HSL"

    def test_saturation_property_returns_hsl(self):
        assert determine_optimal_color_space(200, 100, 50, "saturation") == "HSL"

    def test_brightness_property_returns_hsl(self):
        assert determine_optimal_color_space(200, 100, 50, "brightness") == "HSL"

    def test_near_white_returns_hsl(self):
        # Lightness >= 90 → HSL
        result = determine_optimal_color_space(240, 240, 240)
        assert result == "HSL"

    def test_pure_red_single_channel_returns_rgb(self):
        # Only R channel above threshold → RGB
        result = determine_optimal_color_space(255, 0, 0)
        assert result == "RGB"

    def test_pure_green_single_channel_returns_rgb(self):
        result = determine_optimal_color_space(0, 255, 0)
        assert result == "RGB"

    def test_pure_blue_single_channel_returns_rgb(self):
        result = determine_optimal_color_space(0, 0, 255)
        assert result == "RGB"

    def test_pure_cyan_returns_cmyk(self):
        # (0, 255, 255) is explicitly mapped to CMYK
        result = determine_optimal_color_space(0, 255, 255)
        assert result == "CMYK"

    def test_pure_magenta_returns_cmyk(self):
        result = determine_optimal_color_space(255, 0, 255)
        assert result == "CMYK"

    def test_pure_yellow_returns_cmyk(self):
        result = determine_optimal_color_space(255, 255, 0)
        assert result == "CMYK"

    def test_mixed_color_returns_valid_space(self):
        # A typical mixed color should return one of the valid spaces
        result = determine_optimal_color_space(128, 64, 192)
        assert result in _VALID_SPACES

    def test_no_adjust_property_is_valid(self):
        result = determine_optimal_color_space(100, 150, 200, None)
        assert result in _VALID_SPACES
