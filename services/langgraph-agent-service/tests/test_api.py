"""API surface: /health and the skeleton /agent/run contract."""

from app.main import create_app


def test_health(client) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_agent_run_skeleton_result_marks_b2_work(client, auth_headers) -> None:
    import uuid

    rid = str(uuid.uuid4())
    resp = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"task": "x"}}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["run_id"] == rid
    # Skeleton deliberately has no agent logic: the result says so, honestly,
    # AND the status says so too (B1-3: stub is never "complete").
    assert body["result"]["agent_logic"] == "not_implemented"
    assert body["status"] == "stub"


def test_openapi_lists_agent_run() -> None:
    from fastapi.testclient import TestClient

    from app.runs import InMemoryRunStore

    app = create_app(run_store=InMemoryRunStore())
    resp = TestClient(app).get("/openapi.json")
    assert "/agent/run" in resp.json()["paths"]
