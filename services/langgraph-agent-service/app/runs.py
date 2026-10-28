"""Run records with idempotency (claim-then-fill).

The client supplies the run id. A duplicate run id returns the existing
result and never re-executes: the executor callable is invoked at most
once per run id, INCLUDING on failure — a failed run records its failure
instead of leaving the id unclaimed for a silent re-execution.

Lock discipline (B1-2 / F-B1-3): the lock is held ONLY to claim a run id
(insert a "running" placeholder) and to fill the finished record. It is
NEVER held across executor execution, so one slow run cannot serialize
all other run ids. A concurrent duplicate of an in-flight run waits on
that run's event and then returns the finished record.

LIMIT, stated plainly: this store is in-memory. A process restart loses
all records, and duplicates after a restart WILL re-execute. That is a
skeleton limit, not a guarantee — the production wiring leg replaces
this store with a Postgres-backed store behind the same record shape
(input / status / result / error). Do not quote this module's
at-most-once claim across restarts.

BOUND (R-B1-4): completion events are pruned — the owner's event entry
is deleted once the record is filled, so _events does not grow with
every completed run (a waiter already holds its event object, so
deletion cannot strand it). A waiting duplicate does NOT wait forever:
event.wait() is bounded by wait_timeout_seconds (default 300s) and
raises TimeoutError on expiry; the owner still completes normally.
_run records_ are intentionally retained for the process lifetime —
they ARE the idempotency state, so pruning them would re-enable
re-execution; their replacement is the Postgres-backed store (wiring
item, not faked here).
"""

import threading
from typing import Any, Callable


class InMemoryRunStore:
    """Thread-safe in-memory run store (tests and local skeleton use only)."""

    def __init__(self, wait_timeout_seconds: float | None = 300.0) -> None:
        self._wait_timeout = wait_timeout_seconds
        self._lock = threading.Lock()
        self._runs: dict[str, dict[str, Any]] = {}
        self._events: dict[str, threading.Event] = {}

    def pending_event_count(self) -> int:
        """In-flight completion events currently held (0 when idle)."""
        with self._lock:
            return len(self._events)

    def create_or_get(
        self, run_id: str, run_input: dict[str, Any], executor: Callable[[], Any]
    ) -> tuple[bool, dict[str, Any]]:
        """Claim-then-fill. Return (created, record copy).

        Record shape: {"input", "status", "result", "error"} where status
        is "running" only transiently (never returned), "complete", or
        "failed". Executor failures are recorded, not raised: a duplicate
        then returns the failed record instead of re-executing.
        """
        with self._lock:
            existing = self._runs.get(run_id)
            if existing is not None and existing["status"] != "running":
                return False, dict(existing)
            if existing is not None:
                event = self._events[run_id]
                owner = False
            else:
                self._runs[run_id] = {
                    "input": run_input,
                    "result": None,
                    "status": "running",
                    "error": None,
                }
                event = threading.Event()
                self._events[run_id] = event
                owner = True
        if not owner:
            # Bounded wait (R-B1-4): a hung executor must not block a
            # duplicate caller forever. On timeout raise — the owner
            # still completes and fills the record normally.
            finished = event.wait(timeout=self._wait_timeout)
            if not finished:
                raise TimeoutError(
                    f"run {run_id} did not complete within "
                    f"{self._wait_timeout}s"
                )
            with self._lock:
                return False, dict(self._runs[run_id])
        try:
            result = executor()
        except Exception as exc:  # noqa: BLE001 - failure must be recorded, not lost
            record = {
                "input": run_input,
                "result": None,
                "status": "failed",
                "error": f"{type(exc).__name__}: {exc}",
            }
        else:
            record = {
                "input": run_input,
                "result": result,
                "status": "complete",
                "error": None,
            }
        with self._lock:
            self._runs[run_id] = record
        event.set()
        # Prune the completion event (R-B1-4): waiters already hold
        # this event object, so deleting the dict entry strands nobody.
        with self._lock:
            self._events.pop(run_id, None)
        return True, dict(record)

    def get_record(self, run_id: str) -> dict[str, Any] | None:
        """Return the stored record (input + status + result + error), if any."""
        with self._lock:
            record = self._runs.get(run_id)
            return dict(record) if record is not None else None
