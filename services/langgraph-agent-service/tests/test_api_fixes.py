"""API contract fixes (B1-3 stub status, F-B1-1 409 on input mismatch,
B1-6 run_id validation + unset-secret 401). Written first; must FAIL
against the old main.py, which always returned status=complete."""

import uuid

from app.main import create_app
from app.runs import InMemoryRunStore


def _rid() -> str:
    return str(uuid.uuid4())


def test_stub_status_is_distinct_from_complete(client, auth_headers) -> None:
    resp = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": _rid(), "input": {"task": "x"}}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["result"]["agent_logic"] == "not_implemented"
    assert body["status"] != "complete"
    assert body["status"] == "stub"


def test_duplicate_with_different_input_returns_409_without_result(
    client, auth_headers
) -> None:
    rid = _rid()
    first = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"q": 1}}
    )
    assert first.status_code == 200
    second = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"q": 2}}
    )
    assert second.status_code == 409
    assert "result" not in second.json()
    assert "q" not in second.text


def test_duplicate_with_same_input_returns_existing(client, auth_headers) -> None:
    rid = _rid()
    first = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"q": 1}}
    )
    second = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"q": 1}}
    )
    assert second.status_code == 200
    assert second.json() == first.json()


def test_empty_and_whitespace_run_id_rejected(client, auth_headers) -> None:
    for bad in ("", "   "):
        resp = client.post(
            "/agent/run", headers=auth_headers, json={"run_id": bad, "input": {}}
        )
        assert resp.status_code == 422


def test_non_uuid_run_id_rejected(client, auth_headers) -> None:
    resp = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": "run-dup-1", "input": {}}
    )
    assert resp.status_code == 422


def test_unset_secret_env_returns_401(monkeypatch) -> None:
    """No AGENT_SHARED_SECRET configured anywhere -> fail closed (401),
    even with a header presented."""
    from fastapi.testclient import TestClient

    monkeypatch.delenv("AGENT_SHARED_SECRET", raising=False)
    app = create_app(run_store=InMemoryRunStore())
    resp = TestClient(app).post(
        "/agent/run",
        headers={"X-Agent-Shared-Secret": "anything"},
        json={"run_id": _rid(), "input": {}},
    )
    assert resp.status_code == 401


def test_executor_failure_returns_failed_status_not_500(client, auth_headers) -> None:
    from fastapi.testclient import TestClient

    def failing(run_id: str, run_input: dict) -> dict:
        raise RuntimeError("executor broke")

    app = create_app(run_store=InMemoryRunStore(), executor=failing)
    test_client = TestClient(app)
    resp = test_client.post(
        "/agent/run", headers=auth_headers, json={"run_id": _rid(), "input": {}}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "failed"
    assert "executor broke" in resp.json()["result"]["error"]
    # And a duplicate returns the same failure without re-executing.
    resp2 = test_client.post(
        "/agent/run", headers=auth_headers, json={"run_id": resp.json()["run_id"], "input": {}}
    )
    assert resp2.json()["status"] == "failed"
