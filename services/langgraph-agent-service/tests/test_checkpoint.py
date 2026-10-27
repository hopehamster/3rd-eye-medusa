"""Checkpoint config: PostgresSaver-style config from env, pooling, and an
in-memory checkpointer for tests. No live Postgres connection is made here."""

from app.checkpoint import (
    PostgresCheckpointConfig,
    build_postgres_config,
    create_checkpointer,
)


def test_postgres_config_from_env(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass-placeholder@localhost:5432/appdb")
    monkeypatch.setenv("DB_POOL_MIN_SIZE", "2")
    monkeypatch.setenv("DB_POOL_MAX_SIZE", "10")
    cfg = build_postgres_config()
    assert cfg.database_url == "postgresql://user:pass-placeholder@localhost:5432/appdb"
    assert cfg.pool_min_size == 2
    assert cfg.pool_max_size == 10


def test_postgres_config_defaults_without_pool_env(monkeypatch) -> None:
    monkeypatch.delenv("DB_POOL_MIN_SIZE", raising=False)
    monkeypatch.delenv("DB_POOL_MAX_SIZE", raising=False)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass-placeholder@localhost:5432/appdb")
    cfg = build_postgres_config()
    assert cfg.pool_min_size >= 1
    assert cfg.pool_max_size >= cfg.pool_min_size


def test_missing_database_url_raises() -> None:
    import pytest

    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.delenv("DATABASE_URL", raising=False)
    try:
        with pytest.raises(ValueError, match="DATABASE_URL"):
            build_postgres_config()
    finally:
        monkeypatch.undo()


def test_memory_checkpointer_for_tests() -> None:
    saver = create_checkpointer("memory")
    assert saver is not None
    # MemorySaver round-trips a checkpoint without any database.
    from langgraph.checkpoint.memory import MemorySaver

    assert isinstance(saver, MemorySaver)


def test_postgres_saver_factory_is_injected_not_connected() -> None:
    """The Postgres saver is built through an injected factory so tests never
    open a real connection; the factory receives the config verbatim."""
    seen = {}

    class FakeSaver:
        def __init__(self, cfg: PostgresCheckpointConfig) -> None:
            seen["cfg"] = cfg

    cfg = PostgresCheckpointConfig(
        database_url="postgresql://user:pass-placeholder@localhost:5432/appdb",
        pool_min_size=2,
        pool_max_size=10,
    )
    saver = create_checkpointer("postgres", config=cfg, saver_factory=FakeSaver)
    assert isinstance(saver, FakeSaver)
    assert seen["cfg"] is cfg
