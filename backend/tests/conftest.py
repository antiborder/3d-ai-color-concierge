"""
Shared pytest fixtures for the backend test suite.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Return a FastAPI TestClient that wraps the real application."""
    with TestClient(app) as c:
        yield c
