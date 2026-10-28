"""LangGraph checkpoint configuration: pooled PostgresSaver (B1 owns this).

WIRING-SEAM OWNER (reviewer's design question, decided in this fix pass):
B1 owns checkpoint creation AND tool execution. B2's langgraph_adapter
CONSUMES them (it accepts a checkpointer argument and scouts wired to
B1's execute_tool); it does not define its own checkpoint/tool shape.
No second integration shape exists — if one appears, it is a defect.

Real path (B1-1, honoured — not dropped, not deleted): pool bounds from
env are passed to a real psycopg_pool ConnectionPool, and that pool is
passed to the installed langgraph-checkpoint-postgres 2.0.16
PostgresSaver, whose constructor accepts a Connection (single) OR a
ConnectionPool. The single-connection from_conn_string(conn_string)
path is NOT the default here: it returns a context manager over one
autocommit connection and honours no pool bounds.

SETUP STEP (B1-1, named + wired): PostgresSaver.setup() MUST be called
once, after the pool is open and before the first graph invocation — it
creates/migrates the checkpoint tables, and first real checkpoint use
fails without it. The wiring leg owns calling setup_postgres_saver()
once at startup and closing the pool at shutdown; this module names the
step and provides it, but does not call it implicitly at import time
(import must never open a connection). Constructing the config or the
saver object itself never opens a connection (the default pool factory
defers opening until first use — see build_postgres_saver).

Tests use the in-memory checkpointer or injected pool/saver factories,
never a live database.
"""

import os
from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class PostgresCheckpointConfig:
    """PostgresSaver checkpoint config (values only, no live pool)."""

    database_url: str
    pool_min_size: int = 1
    pool_max_size: int = 10


def _parse_pool_bound(name: str, raw: str | None, default: int) -> int:
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        raise ValueError(f"{name} must be an integer, got {raw!r}") from None
    return value


def build_postgres_config() -> PostgresCheckpointConfig:
    """Build checkpoint config from env. Raises if DATABASE_URL is unset
    or pool bounds are non-numeric / inconsistent (B1-6)."""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL env var is required for Postgres checkpointing")
    pool_min = _parse_pool_bound(
        "DB_POOL_MIN_SIZE", os.environ.get("DB_POOL_MIN_SIZE"), 1
    )
    pool_max = _parse_pool_bound(
        "DB_POOL_MAX_SIZE", os.environ.get("DB_POOL_MAX_SIZE"), 10
    )
    if pool_min < 1:
        raise ValueError(f"DB_POOL_MIN_SIZE must be >= 1, got {pool_min}")
    if pool_max < pool_min:
        raise ValueError(
            f"DB_POOL_MAX_SIZE ({pool_max}) must be >= DB_POOL_MIN_SIZE ({pool_min})"
        )
    return PostgresCheckpointConfig(
        database_url=database_url,
        pool_min_size=pool_min,
        pool_max_size=pool_max,
    )


def build_postgres_saver(
    cfg: PostgresCheckpointConfig,
    pool_factory: Callable[..., Any] | None = None,
    saver_factory: Callable[[Any], Any] | None = None,
) -> Any:
    """Build a pooled PostgresSaver from a config.

    Default path (no factories): a real psycopg_pool ConnectionPool with
    the config's bounds, passed to the real PostgresSaver. The pool is
    created with open=False so construction alone never connects; the
    wiring leg opens it (pool.open()) before calling setup_postgres_saver.
    Tests inject pool_factory/saver_factory and never touch a live DB.
    """
    if pool_factory is not None:
        pool = pool_factory(cfg.database_url, cfg.pool_min_size, cfg.pool_max_size)
    else:
        from psycopg_pool import ConnectionPool

        pool = ConnectionPool(
            cfg.database_url,
            min_size=cfg.pool_min_size,
            max_size=cfg.pool_max_size,
            open=False,
        )
    if saver_factory is not None:
        return saver_factory(pool)
    from langgraph.checkpoint.postgres import PostgresSaver

    return PostgresSaver(pool)


def setup_postgres_saver(saver: Any) -> None:
    """REQUIRED FIRST-USE STEP: call once, after the pool is open and
    before the first graph invocation. Creates/migrates checkpoint
    tables (PostgresSaver.setup()). The wiring leg owns this call; it is
    deliberately not hidden inside construction or import."""
    saver.setup()


def create_checkpointer(
    kind: str,
    config: PostgresCheckpointConfig | None = None,
    saver_factory: Callable[[PostgresCheckpointConfig], Any] | None = None,
    pool_factory: Callable[..., Any] | None = None,
) -> Any:
    """Create a LangGraph checkpointer.

    kind="memory": in-memory saver for tests (no database).
    kind="postgres": pooled PostgresSaver via build_postgres_saver. A
        legacy single-arg saver_factory(cfg) is still honoured when
        given (builder-era tests inject that way); otherwise the pooled
        construction is used. NOTE: the saver returned here has NOT had
        setup() called — the wiring leg must call setup_postgres_saver()
        once before first use.
    """
    if kind == "memory":
        from langgraph.checkpoint.memory import MemorySaver

        return MemorySaver()
    if kind == "postgres":
        cfg = config or build_postgres_config()
        if saver_factory is not None and pool_factory is None:
            # Legacy injection shape: factory takes the config directly.
            return saver_factory(cfg)
        if saver_factory is not None:
            return build_postgres_saver(cfg, pool_factory=pool_factory,
                                        saver_factory=saver_factory)
        return build_postgres_saver(cfg, pool_factory=pool_factory)
    raise ValueError(f"unknown checkpointer kind: {kind!r}")
