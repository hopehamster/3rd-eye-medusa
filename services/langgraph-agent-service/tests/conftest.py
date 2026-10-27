"""Shared test fixtures. No live services: fake secrets, mock HTTP, in-memory stores."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("AGENT_SHARED_SECRET", "test-secret-placeholder")
os.environ.setdefault("DATABASE_URL", "postgresql://testuser:testpass-placeholder@localhost:5432/testdb")


@pytest.fixture()
def client(monkeypatch):
    """Fresh app per test with an in-memory run store and a stub executor."""
    from app.main import create_app
    from app.runs import InMemoryRunStore

    monkeypatch.setenv("AGENT_SHARED_SECRET", "test-secret-placeholder")
    app = create_app(run_store=InMemoryRunStore())
    return TestClient(app)


@pytest.fixture()
def auth_headers():
    return {"X-Agent-Shared-Secret": "test-secret-placeholder"}
