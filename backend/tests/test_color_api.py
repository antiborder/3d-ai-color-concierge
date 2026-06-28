"""
A-4: Integration tests for the Color API endpoints.

Endpoints under test (prefix: /api/colors):
  GET /api/colors/search         query params: query, tags, limit, offset
  GET /api/colors/by-hex/{hex}
  GET /api/colors/by-name/{name}
  GET /api/colors/categories
  GET /health

Uses FastAPI's TestClient (backed by httpx) with the real app instance and
real color data — no mocking.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

# One shared client for the entire module; session scope avoids repeated startup.
client = TestClient(app)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health_returns_200(self):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_body(self):
        resp = client.get("/health")
        data = resp.json()
        assert data.get("status") == "healthy"

    def test_root_returns_200(self):
        resp = client.get("/")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# GET /api/colors/search
# ---------------------------------------------------------------------------


class TestColorSearch:
    def test_search_red_returns_200(self):
        resp = client.get("/api/colors/search", params={"query": "red"})
        assert resp.status_code == 200

    def test_search_red_has_results(self):
        resp = client.get("/api/colors/search", params={"query": "red"})
        data = resp.json()
        assert data["total"] >= 1
        assert len(data["results"]) >= 1

    def test_search_result_item_has_name_and_hex(self):
        resp = client.get("/api/colors/search", params={"query": "red"})
        item = resp.json()["results"][0]
        assert "name1" in item
        assert "hex" in item

    def test_search_limit_respected(self):
        resp = client.get("/api/colors/search", params={"query": "red", "limit": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) <= 5

    def test_pagination_offset_different_from_page1(self):
        page1 = client.get("/api/colors/search", params={"limit": 5, "offset": 0}).json()
        page2 = client.get("/api/colors/search", params={"limit": 5, "offset": 5}).json()
        # Dataset has 855 colors; pages must differ
        hexes_p1 = [c["hex"] for c in page1["results"]]
        hexes_p2 = [c["hex"] for c in page2["results"]]
        assert hexes_p1 != hexes_p2

    def test_empty_query_returns_all_colors(self):
        resp = client.get("/api/colors/search")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0

    def test_tag_filter_css(self):
        resp = client.get("/api/colors/search", params={"tags": "CSS"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        for item in data["results"]:
            assert "CSS" in item["tag"]

    def test_tag_filter_reduces_results_vs_unfiltered(self):
        all_resp = client.get("/api/colors/search").json()
        css_resp = client.get("/api/colors/search", params={"tags": "CSS"}).json()
        assert css_resp["total"] < all_resp["total"]

    def test_response_schema_fields(self):
        resp = client.get("/api/colors/search", params={"limit": 2, "offset": 0})
        data = resp.json()
        assert "results" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert data["limit"] == 2
        assert data["offset"] == 0

    def test_nonexistent_query_returns_empty(self):
        resp = client.get("/api/colors/search", params={"query": "xyzzy_nonexistent_12345"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["results"] == []


# ---------------------------------------------------------------------------
# GET /api/colors/by-hex/{hex_code}
# ---------------------------------------------------------------------------


class TestColorByHex:
    def test_known_hex_returns_200(self):
        resp = client.get("/api/colors/by-hex/FF0000")
        assert resp.status_code == 200

    def test_known_hex_body_contains_correct_hex(self):
        resp = client.get("/api/colors/by-hex/FF0000")
        data = resp.json()
        assert "FF0000" in data["hex"].upper()

    def test_hex_with_hash_prefix(self):
        resp = client.get("/api/colors/by-hex/%23FF0000")  # URL-encoded #FF0000
        # Either 200 (found) or 404 (not found with #) is acceptable
        assert resp.status_code in (200, 404)

    def test_lowercase_hex_returns_200(self):
        # Service normalizes to uppercase internally
        resp = client.get("/api/colors/by-hex/ff0000")
        assert resp.status_code == 200

    def test_result_has_name_and_tag(self):
        resp = client.get("/api/colors/by-hex/FF0000")
        data = resp.json()
        assert "name1" in data
        assert "tag" in data

    def test_invalid_hex_returns_404(self):
        resp = client.get("/api/colors/by-hex/ZZZZZZ")
        assert resp.status_code == 404

    def test_another_known_hex(self):
        # #00FF00 Green is in the dataset
        resp = client.get("/api/colors/by-hex/00FF00")
        assert resp.status_code == 200
        data = resp.json()
        assert "00FF00" in data["hex"].upper()


# ---------------------------------------------------------------------------
# GET /api/colors/by-name/{name}
# ---------------------------------------------------------------------------


class TestColorByName:
    def test_known_name_returns_200(self):
        resp = client.get("/api/colors/by-name/red")
        assert resp.status_code == 200

    def test_known_name_returns_list(self):
        resp = client.get("/api/colors/by-name/red")
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_result_items_have_hex_and_name(self):
        resp = client.get("/api/colors/by-name/blue")
        data = resp.json()
        for item in data:
            assert "hex" in item
            assert "name1" in item

    def test_unknown_name_returns_empty_list(self):
        resp = client.get("/api/colors/by-name/xyzzy_nonexistent_12345")
        assert resp.status_code == 200
        assert resp.json() == []


# ---------------------------------------------------------------------------
# GET /api/colors/categories
# ---------------------------------------------------------------------------


class TestColorCategories:
    def test_categories_returns_200(self):
        resp = client.get("/api/colors/categories")
        assert resp.status_code == 200

    def test_categories_body_has_categories_key(self):
        data = client.get("/api/colors/categories").json()
        assert "categories" in data

    def test_categories_is_dict(self):
        data = client.get("/api/colors/categories").json()
        assert isinstance(data["categories"], dict)

    def test_known_tags_in_categories(self):
        data = client.get("/api/colors/categories").json()
        cats = data["categories"]
        assert "CSS" in cats
        assert "JAPANESE" in cats
        assert "MATERIAL" in cats

    def test_all_counts_positive(self):
        data = client.get("/api/colors/categories").json()
        for tag, count in data["categories"].items():
            assert count > 0, f"Category '{tag}' has non-positive count: {count}"
