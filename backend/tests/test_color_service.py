"""
S-2: Unit tests for app/services/color_service.py

Tests use the real sample_colors.json dataset (855 colors) — no mocking of data.

ColorService.{
    _hex_to_rgb(hex_code) -> dict{"r", "g", "b"}
    find_closest_colors(r, g, b, top_n, language, exclude_tags) -> list[dict]
    search_by_name(name, exclude_tags) -> list[ColorItem]
    get_categories() -> dict[str, int]
    search(query, tags, limit, offset) -> ColorSearchResponse
}
"""

import pytest

from app.services.color_service import ColorService


@pytest.fixture(scope="module")
def svc() -> ColorService:
    """Shared ColorService instance loaded from the real data file."""
    return ColorService()


# ---------------------------------------------------------------------------
# _hex_to_rgb
# ---------------------------------------------------------------------------


class TestHexToRgb:
    def test_pure_red_uppercase(self, svc):
        assert svc._hex_to_rgb("#FF0000") == {"r": 255, "g": 0, "b": 0}

    def test_pure_red_lowercase(self, svc):
        assert svc._hex_to_rgb("#ff0000") == {"r": 255, "g": 0, "b": 0}

    def test_black(self, svc):
        assert svc._hex_to_rgb("#000000") == {"r": 0, "g": 0, "b": 0}

    def test_white_lowercase(self, svc):
        assert svc._hex_to_rgb("#ffffff") == {"r": 255, "g": 255, "b": 255}

    def test_without_hash(self, svc):
        # lstrip('#') handles missing '#' gracefully
        assert svc._hex_to_rgb("00FF00") == {"r": 0, "g": 255, "b": 0}

    def test_arbitrary_color(self, svc):
        result = svc._hex_to_rgb("#1A2B3C")
        assert result == {"r": 0x1A, "g": 0x2B, "b": 0x3C}

    def test_returns_dict_with_rgb_keys(self, svc):
        result = svc._hex_to_rgb("#ABCDEF")
        assert set(result.keys()) == {"r", "g", "b"}

    def test_invalid_hex_raises(self, svc):
        with pytest.raises((ValueError, Exception)):
            svc._hex_to_rgb("#ZZZZZZ")

    def test_too_short_raises(self, svc):
        with pytest.raises((ValueError, Exception)):
            svc._hex_to_rgb("#FFF")


# ---------------------------------------------------------------------------
# find_closest_colors
# ---------------------------------------------------------------------------


class TestFindClosestColors:
    def test_red_closest_has_low_distance(self, svc):
        results = svc.find_closest_colors(255, 0, 0, top_n=5)
        # The dataset contains #FF0000 "Red", so distance should be 0.0
        assert results[0]["distance"] == pytest.approx(0.0, abs=0.1)

    def test_results_sorted_by_distance_ascending(self, svc):
        results = svc.find_closest_colors(100, 150, 200, top_n=10)
        distances = [r["distance"] for r in results]
        assert distances == sorted(distances)

    def test_top_n_limits_results(self, svc):
        results = svc.find_closest_colors(128, 128, 128, top_n=3)
        assert len(results) <= 3

    def test_default_top_n_is_five(self, svc):
        results = svc.find_closest_colors(200, 100, 50)
        assert len(results) <= 5

    def test_result_dict_has_expected_keys(self, svc):
        results = svc.find_closest_colors(255, 0, 0, top_n=1)
        assert len(results) == 1
        item = results[0]
        assert "name" in item
        assert "hex" in item
        assert "r" in item
        assert "g" in item
        assert "b" in item
        assert "tags" in item
        assert "distance" in item

    def test_exclude_tags_removes_colors(self, svc):
        # Results without exclude
        all_results = svc.find_closest_colors(255, 0, 0, top_n=50)
        all_tags = {tag for r in all_results for tag in r["tags"]}

        if "CSS" in all_tags:
            filtered = svc.find_closest_colors(255, 0, 0, top_n=50, exclude_tags=["CSS"])
            for r in filtered:
                assert "CSS" not in r["tags"]

    def test_zero_top_n_returns_empty(self, svc):
        results = svc.find_closest_colors(128, 64, 32, top_n=0)
        assert results == []

    def test_distance_is_non_negative(self, svc):
        results = svc.find_closest_colors(10, 20, 30, top_n=5)
        for r in results:
            assert r["distance"] >= 0.0


# ---------------------------------------------------------------------------
# search_by_name
# ---------------------------------------------------------------------------


class TestSearchByName:
    def test_exact_name_match(self, svc):
        # "Red" is in the dataset (CSS tag)
        results = svc.search_by_name("Red")
        names = [c.name1.lower() for c in results]
        assert any("red" in n for n in names)

    def test_case_insensitive(self, svc):
        lower = svc.search_by_name("red")
        upper = svc.search_by_name("RED")
        assert len(lower) == len(upper)

    def test_partial_match(self, svc):
        # "coral" should match "coral" and "lightcoral"
        results = svc.search_by_name("coral")
        assert len(results) >= 1

    def test_space_normalization(self, svc):
        # "light coral" (with space) should find "lightcoral" via space removal
        results_spaced = svc.search_by_name("light coral")
        results_nospace = svc.search_by_name("lightcoral")
        # Both should find at least the "lightcoral" entry
        assert len(results_spaced) >= 1
        assert len(results_nospace) >= 1

    def test_returns_list_of_color_items(self, svc):
        from app.api.schemas.colors import ColorItem

        results = svc.search_by_name("blue")
        assert isinstance(results, list)
        for item in results:
            assert isinstance(item, ColorItem)

    def test_no_match_returns_empty_list(self, svc):
        results = svc.search_by_name("xyzzy_nonexistent_color_name_12345")
        assert results == []

    def test_exclude_tags_filters_out_tag(self, svc):
        # "Red" appears in CSS. Excluding CSS should remove those entries.
        all_results = svc.search_by_name("red")
        css_in_all = any("CSS" in c.tag for c in all_results)

        if css_in_all:
            filtered = svc.search_by_name("red", exclude_tags=["CSS"])
            for c in filtered:
                assert "CSS" not in c.tag


# ---------------------------------------------------------------------------
# get_categories
# ---------------------------------------------------------------------------


class TestGetCategories:
    def test_returns_dict(self, svc):
        cats = svc.get_categories()
        assert isinstance(cats, dict)

    def test_all_counts_positive(self, svc):
        cats = svc.get_categories()
        for tag, count in cats.items():
            assert count > 0, f"Category '{tag}' has count {count}"

    def test_known_tags_present(self, svc):
        cats = svc.get_categories()
        # The dataset contains CSS, JAPANESE, MATERIAL tags
        assert "CSS" in cats
        assert "JAPANESE" in cats
        assert "MATERIAL" in cats

    def test_counts_sum_to_at_least_total_colors(self, svc):
        # Colors can have multiple tags, so sum >= total unique colors
        cats = svc.get_categories()
        total_colors = len(svc._colors)
        assert sum(cats.values()) >= total_colors


# ---------------------------------------------------------------------------
# search
# ---------------------------------------------------------------------------


class TestSearch:
    def test_empty_query_returns_results(self, svc):
        resp = svc.search()
        assert resp.total > 0
        assert len(resp.results) > 0

    def test_query_red_returns_results(self, svc):
        resp = svc.search(query="red")
        assert resp.total >= 1
        names = [c.name1.lower() for c in resp.results]
        assert any("red" in n for n in names)

    def test_pagination_limit(self, svc):
        resp = svc.search(limit=10)
        assert len(resp.results) <= 10

    def test_pagination_offset_changes_results(self, svc):
        page1 = svc.search(limit=5, offset=0)
        page2 = svc.search(limit=5, offset=5)
        # Pages must not be identical (dataset has > 10 colors)
        ids_p1 = [c.hex for c in page1.results]
        ids_p2 = [c.hex for c in page2.results]
        assert ids_p1 != ids_p2

    def test_tag_filter_reduces_results(self, svc):
        all_resp = svc.search()
        css_resp = svc.search(tags=["CSS"])
        assert css_resp.total < all_resp.total
        for color in css_resp.results:
            assert "CSS" in color.tag

    def test_total_field_reflects_full_match_count(self, svc):
        resp = svc.search(query="red", limit=1)
        assert resp.total > 1  # more than the single result returned

    def test_response_fields(self, svc):
        resp = svc.search(limit=5, offset=0)
        assert resp.limit == 5
        assert resp.offset == 0
        assert isinstance(resp.results, list)
        assert isinstance(resp.total, int)

    def test_hex_exact_match(self, svc):
        # FF0000 should match the Red entry
        resp = svc.search(query="FF0000")
        assert resp.total >= 1
        hexes = [c.hex.upper().lstrip("#") for c in resp.results]
        assert "FF0000" in hexes

    def test_unknown_query_returns_empty(self, svc):
        resp = svc.search(query="xyzzy_nonexistent_12345")
        assert resp.total == 0
        assert resp.results == []
