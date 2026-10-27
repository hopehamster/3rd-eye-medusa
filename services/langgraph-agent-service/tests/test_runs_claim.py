"""Claim-then-fill run store (B1-2 / F-B1-3): reserve before executing,
never hold the lock across execution, record failures, concurrent
duplicates execute once. Written first; must FAIL against the old store."""

import threading
import uuid

import pytest

from app.runs import InMemoryRunStore


def _rid() -> str:
    return str(uuid.uuid4())


def test_executor_exception_records_failure_and_does_not_reexecute() -> None:
    store = InMemoryRunStore()
    calls = {"n": 0}

    def failing() -> dict:
        calls["n"] += 1
        raise RuntimeError("boom")

    created, record = store.create_or_get(_rid(), {"x": 1}, failing)
    assert created is True
    assert record["status"] == "failed"
    assert "boom" in (record["error"] or "")
    # A retry with the same run id must NOT re-execute: the failure stands.
    rid = _rid()
    store.create_or_get(rid, {"x": 1}, failing)
    created2, record2 = store.create_or_get(rid, {"x": 1}, lambda: {"ok": True})
    assert created2 is False
    assert record2["status"] == "failed"
    assert calls["n"] == 2  # one per distinct run id, never a second per id


def test_concurrent_duplicate_run_ids_execute_once() -> None:
    store = InMemoryRunStore()
    rid = _rid()
    calls = {"n": 0}

    def slow_executor() -> dict:
        # Only ONE thread may ever run this (that is the property under
        # test); sleep so the duplicate thread arrives while it runs.
        calls["n"] += 1
        threading.Event().wait(0.5)
        return {"ok": True}

    results: list = []

    def worker() -> None:
        results.append(store.create_or_get(rid, {"x": 1}, slow_executor))

    threads = [threading.Thread(target=worker) for _ in range(2)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=10)
    assert calls["n"] == 1
    assert len(results) == 2
    assert results[0][1]["result"] == {"ok": True}
    assert results[1][1]["result"] == {"ok": True}


def test_lock_not_held_across_execution() -> None:
    """A slow run for id A must not block a run for id B."""
    store = InMemoryRunStore()
    started = threading.Event()
    release = threading.Event()

    def slow() -> dict:
        started.set()
        release.wait(timeout=10)
        return {"slow": True}

    outcome: list = []

    def slow_worker() -> None:
        outcome.append(store.create_or_get(_rid(), {}, slow))

    t = threading.Thread(target=slow_worker)
    t.start()
    assert started.wait(timeout=5)
    # While the slow run executes, a different run id must complete.
    created, record = store.create_or_get(_rid(), {}, lambda: {"fast": True})
    assert created is True
    assert record["result"] == {"fast": True}
    release.set()
    t.join(timeout=10)


def test_success_record_shape() -> None:
    store = InMemoryRunStore()
    created, record = store.create_or_get(_rid(), {"x": 1}, lambda: {"ok": True})
    assert created is True
    assert record["status"] == "complete"
    assert record["result"] == {"ok": True}
    assert record["input"] == {"x": 1}
