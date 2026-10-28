"""Run records: client-supplied UUID run id; a duplicate run id with the
SAME input returns the existing result and never re-executes. A duplicate
with DIFFERENT input is a 409 (see test_api_fixes.py, F-B1-1)."""

import uuid

from app.runs import InMemoryRunStore


def _rid() -> str:
    return str(uuid.uuid4())


def test_duplicate_run_id_returns_existing_result_without_reexecution(client, auth_headers) -> None:
    rid = _rid()
    first = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"q": 1}}
    )
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["run_id"] == rid

    second = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": rid, "input": {"q": 1}}
    )
    assert second.status_code == 200
    assert second.json() == first_body
    # The second call kept the ORIGINAL input, proving no re-execution happened.
    assert second.json()["input"] == {"q": 1}


def test_distinct_run_ids_are_distinct_runs(client, auth_headers) -> None:
    a = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": _rid(), "input": {}}
    )
    b = client.post(
        "/agent/run", headers=auth_headers, json={"run_id": _rid(), "input": {}}
    )
    assert a.json()["run_id"] != b.json()["run_id"]


def test_run_id_is_required(client, auth_headers) -> None:
    resp = client.post("/agent/run", headers=auth_headers, json={"input": {}})
    assert resp.status_code == 422


def test_store_create_or_get_does_not_overwrite() -> None:
    store = InMemoryRunStore()
    created, first = store.create_or_get("r1", {"x": 1}, lambda: {"ok": True})
    assert created is True
    assert first["status"] == "complete"
    assert first["result"] == {"ok": True}
    created_again, second = store.create_or_get("r1", {"x": 2}, lambda: {"ok": False})
    assert created_again is False
    assert second == first
