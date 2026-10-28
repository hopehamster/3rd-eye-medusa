"""Pooled checkpoint construction + setup() wiring (B1-1, B1-6).

Written first; must FAIL against the old checkpoint module, which dropped
pool bounds on the real path and never named a setup() step."""

import pytest

from app.checkpoint import (
    PostgresCheckpointConfig,
    build_postgres_config,
    build_postgres_saver,
    create_checkpointer,
    setup_postgres_saver,
)


def test_pool_bounds_reach_the_saver_construction(monkeypatch) -> None:
    """Pool bounds are passed to a real pooled construction, not dropped."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass-placeholder@localhost:5432/appdb")
    monkeypatch.setenv("DB_POOL_MIN_SIZE", "2")
    monkeypatch.setenv("DB_POOL_MAX_SIZE", "7")
    seen: dict = {}

    class FakePool:
        def __init__(self, conninfo: str, min_size: int, max_size: int) -> None:
            seen["conninfo"] = conninfo
            seen["min_size"] = min_size
            seen["max_size"] = max_size

    class FakeSaver:
        def __init__(self, pool: FakePool) -> None:
            seen["pool"] = pool

    cfg = build_postgres_config()
    saver = build_postgres_saver(cfg, pool_factory=FakePool, saver_factory=FakeSaver)
    assert isinstance(saver, FakeSaver)
    assert seen["min_size"] == 2
    assert seen["max_size"] == 7
    assert seen["pool"] is not None
    assert "appdb" in seen["conninfo"]


def test_real_saver_accepts_a_pool_object_without_connecting() -> None:
    """The installed PostgresSaver really does accept a pool (not only a
    single connection): construct one with open=False so no DB is touched."""
    from psycopg_pool import ConnectionPool

    from langgraph.checkpoint.postgres import PostgresSaver

    pool = ConnectionPool(
        "postgresql://user:pass-placeholder@localhost:5432/appdb",
        min_size=1,
        max_size=2,
        open=False,
    )
    saver = PostgresSaver(pool)
    assert saver.conn is pool


def test_setup_step_calls_saver_setup_once() -> None:
    calls = {"n": 0}

    class FakeSaver:
        def setup(self) -> None:
            calls["n"] += 1

    setup_postgres_saver(FakeSaver())
    assert calls["n"] == 1


def test_from_conn_string_returns_context_manager_not_saver() -> None:
    """Documents the single-connection path for what it is: from_conn_string
    returns a context manager, NOT a saver instance, and NOT a pool."""
    from langgraph.checkpoint.postgres import PostgresSaver

    cm = PostgresSaver.from_conn_string("postgresql://user:pass-placeholder@localhost:5432/appdb")
    assert hasattr(cm, "__enter__")
    assert not isinstance(cm, PostgresSaver)


def test_bad_pool_env_rejected(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass-placeholder@localhost:5432/appdb")
    monkeypatch.setenv("DB_POOL_MIN_SIZE", "not-a-number")
    with pytest.raises(ValueError, match="DB_POOL_MIN_SIZE"):
        build_postgres_config()
    monkeypatch.setenv("DB_POOL_MIN_SIZE", "10")
    monkeypatch.setenv("DB_POOL_MAX_SIZE", "2")
    with pytest.raises(ValueError, match="DB_POOL_MAX_SIZE"):
        build_postgres_config()


def test_default_checkpointer_path_is_pooled(monkeypatch) -> None:
    """create_checkpointer('postgres') without a factory uses the pooled
    construction (pool_factory injectable so no live DB is touched)."""
    cfg = PostgresCheckpointConfig(
        database_url="postgresql://user:pass-placeholder@localhost:5432/appdb",
        pool_min_size=1,
        pool_max_size=3,
    )
    seen: dict = {}

    class FakePool:
        def __init__(self, conninfo: str, min_size: int, max_size: int) -> None:
            seen.update(conninfo=conninfo, min_size=min_size, max_size=max_size)

    class FakeSaver:
        def __init__(self, pool: FakePool) -> None:
            seen["pool"] = pool

    saver = create_checkpointer(
        "postgres", config=cfg, pool_factory=FakePool, saver_factory=FakeSaver
    )
    assert isinstance(saver, FakeSaver)
    assert seen["min_size"] == 1 and seen["max_size"] == 3
