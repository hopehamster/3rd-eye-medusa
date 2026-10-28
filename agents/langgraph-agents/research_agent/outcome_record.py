"""Outcome record: writer design for the n8n/B1 wiring leg.

Who writes what (outcome-record-spec.md, unchanged by the 2026-10-27
corrections): n8n workflows and the B1 service leg write outcome
records as candidates move through judgement -> human decision ->
listing -> sales -> fulfilment. The agent itself does NOT own the
record store; it supplies its verdict (with outcome_record_id) and the
wiring leg links verdict, human decision, and outcome to the same
record. The wiring leg PRE-CREATES the record before the verdict is
finalized and passes its id into the run, so the verdict carries
outcome_record_id from the start — never a backfill.

This module is the offline-testable core of that writer: pure
functions that build parameterized SQL (values are parameters, never
interpolated) for the Postgres schema in outcome_schema.sql. No live
database, no connection, no I/O — the wiring leg executes the
returned SQL against Postgres. The append-only rule is enforced
here: later fields (human decision, real outcome, confounders,
loser actions) fill in over time, but earlier fields (signals,
verdict) are NEVER rewritten to match the outcome — an update that
touches a verdict field raises ValueError.

Creation paths, stated so the wiring leg cannot follow both into a
contradiction (Code Review M5):
- Pre-created row: the wiring leg inserts the precreate_record row
  (verdict fields NULL) before the verdict is finalized, then fills
  it exactly once with build_verdict_fill_sql. The fill's WHERE
  clause requires the verdict fields still be NULL, so a second fill
  matches no row; the wiring leg must check the affected row count
  is 1 and treat 0 as already-filled-or-missing, never retry it as
  an insert.
- Single creation: when no row was pre-created, build_insert_sql is
  the single row creation. It must never be used on a pre-created
  record id (that would primary-key-conflict); the fill path owns
  pre-created rows.
- Later fields only: build_update_sql fills human decision, real
  outcome, and the other later fields. It refuses verdict fields.

Weak families (Code Review M6 / Security M5): weak_critical_families
is persisted on the Verdict and in the outcome record, and only the
verify/evidence assessment may set it — the wiring leg must accept
weak flags only from that assessment, not from any caller.
Re-judgements link to the prior vetoed record id (prior_record_id);
corrected signals are retained on the new record, the prior record
is never overwritten.

UPDATE safety (regression guard): build_update_sql checks every
field name against the allowlist BEFORE interpolating any name into
SQL. Field names are never values and never parameters in Postgres,
so the allowlist check is the whole defense — its order (check
first, interpolate second) is pinned by test in
tests/test_fix_outcome.py and must not be reordered.

Shadow outcomes for skipped candidates: a candidate never listed gets
real_outcome "not listed" plus a later signal re-check recorded as
observation only. Sales are NEVER imputed for a skipped candidate,
and no function here accepts an imputed-sales value.

Product testing was REMOVED (Michael 2026-10-27, comment 6460788465):
there is no test-spend field, no sample-order field, and no ad-test
field anywhere in this schema or writer.
"""

import uuid

from research_agent.state import Signal

#: Fields set at judgement time. Updates touching any of these are refused.
VERDICT_FIELDS: frozenset[str] = frozenset({
    "candidate_id", "candidate_name", "signals", "agreeing_families",
    "disagreeing_families", "vetoed_by", "score", "verdict", "reasoning",
    "confidence", "best_effort", "verified",
    "weak_critical_families", "prior_record_id",
})

#: Fields that may fill in after judgement.
LATER_FIELDS: frozenset[str] = frozenset({
    "human_decision", "human_reason", "human_decider", "real_outcome",
    "confounders", "loser_actions", "shadow_observation",
    "override_recheck_record_id", "override_recheck_checked_at",
})


def precreate_record(*, candidate_id: str, candidate_name: str,
                     record_id: str | None = None) -> dict:
    """Build the pre-created record the wiring leg inserts first.

    The verdict, human decision, and real outcome are None until
    filled in; the record id is returned to the run so the verdict
    can carry outcome_record_id from the start.
    """
    return {
        "record_id": record_id or str(uuid.uuid4()),
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "signals": None,
        "agreeing_families": None,
        "disagreeing_families": None,
        "vetoed_by": None,
        "score": None,
        "verdict": None,
        "reasoning": None,
        "confidence": None,
        "best_effort": None,
        "verified": None,
        "weak_critical_families": None,
        "prior_record_id": None,
        "human_decision": None,
        "human_reason": None,
        "human_decider": None,
        "real_outcome": None,
        "confounders": None,
        "loser_actions": None,
        "shadow_observation": None,
        "override_recheck_record_id": None,
        "override_recheck_checked_at": None,
    }


def _signals_json(signals: list[Signal]) -> list[dict]:
    return [{
        "family": s.family, "name": s.name, "direction": s.direction,
        "strength": s.strength, "evidence": s.evidence, "source": s.source,
    } for s in signals]


def build_insert_sql(
    *, record_id: str, candidate_id: str, candidate_name: str,
    signals: list[Signal], agreeing_families: list[str],
    disagreeing_families: list[str], vetoed_by: list[str],
    score: float | None, verdict: str, reasoning: str, confidence: float,
    best_effort: bool, verified: bool | None,
    weak_critical_families: list[str] | None = None,
    prior_record_id: str | None = None,
) -> tuple[str, dict]:
    """Parameterized INSERT for a judgement. Returns (sql, params).

    Single-creation path only: use this when no row was pre-created
    for record_id. For a pre-created row, use build_verdict_fill_sql.
    """
    sql = (
        "INSERT INTO outcome_records "
        "(record_id, candidate_id, candidate_name, signals, "
        "agreeing_families, disagreeing_families, vetoed_by, score, "
        "verdict, reasoning, confidence, best_effort, verified, "
        "weak_critical_families, prior_record_id) "
        "VALUES (%(record_id)s, %(candidate_id)s, %(candidate_name)s, "
        "%(signals)s, %(agreeing_families)s, %(disagreeing_families)s, "
        "%(vetoed_by)s, %(score)s, %(verdict)s, %(reasoning)s, "
        "%(confidence)s, %(best_effort)s, %(verified)s, "
        "%(weak_critical_families)s, %(prior_record_id)s)"
    )
    params = {
        "record_id": record_id, "candidate_id": candidate_id,
        "candidate_name": candidate_name, "signals": _signals_json(signals),
        "agreeing_families": agreeing_families,
        "disagreeing_families": disagreeing_families, "vetoed_by": vetoed_by,
        "score": score, "verdict": verdict, "reasoning": reasoning,
        "confidence": confidence, "best_effort": best_effort,
        "verified": verified,
        "weak_critical_families": weak_critical_families,
        "prior_record_id": prior_record_id,
    }
    return sql, params


def build_verdict_fill_sql(
    *, record_id: str,
    signals: list[Signal], agreeing_families: list[str],
    disagreeing_families: list[str], vetoed_by: list[str],
    score: float | None, verdict: str, reasoning: str, confidence: float,
    best_effort: bool, verified: bool | None,
    weak_critical_families: list[str] | None = None,
    prior_record_id: str | None = None,
) -> tuple[str, dict]:
    """One-time verdict fill for a pre-created row. Returns (sql, params).

    The WHERE clause requires the verdict fields still be NULL, so
    the fill succeeds exactly once: a second fill matches no row.
    The wiring leg must check the affected row count is 1. This is
    the only verdict-writing path for a pre-created row — never
    build_insert_sql (primary-key conflict) and never
    build_update_sql (verdict fields refused there).
    """
    sql = (
        "UPDATE outcome_records SET "
        "signals = %(signals)s, "
        "agreeing_families = %(agreeing_families)s, "
        "disagreeing_families = %(disagreeing_families)s, "
        "vetoed_by = %(vetoed_by)s, score = %(score)s, "
        "verdict = %(verdict)s, reasoning = %(reasoning)s, "
        "confidence = %(confidence)s, best_effort = %(best_effort)s, "
        "verified = %(verified)s, "
        "weak_critical_families = %(weak_critical_families)s, "
        "prior_record_id = %(prior_record_id)s "
        "WHERE record_id = %(record_id)s "
        "AND verdict IS NULL AND signals IS NULL AND reasoning IS NULL"
    )
    params = {
        "record_id": record_id, "signals": _signals_json(signals),
        "agreeing_families": agreeing_families,
        "disagreeing_families": disagreeing_families, "vetoed_by": vetoed_by,
        "score": score, "verdict": verdict, "reasoning": reasoning,
        "confidence": confidence, "best_effort": best_effort,
        "verified": verified,
        "weak_critical_families": weak_critical_families,
        "prior_record_id": prior_record_id,
    }
    return sql, params


def build_update_sql(*, record_id: str, fields: dict) -> tuple[str, dict]:
    """Parameterized UPDATE for later fields only.

    Raises ValueError if any field is a verdict field: earlier fields
    are never rewritten to match the outcome.

    Order is the safety property and is pinned by regression test:
    every field name is checked against VERDICT_FIELDS and
    LATER_FIELDS BEFORE any name is interpolated into the SQL
    string. Values are parameters, never interpolated; field names
    cannot be parameters, so the allowlist check must run first.
    """
    forbidden = sorted(set(fields) & VERDICT_FIELDS)
    if forbidden:
        raise ValueError(
            "outcome record verdict fields are append-only and cannot be "
            f"rewritten: {', '.join(forbidden)}"
        )
    unknown = sorted(set(fields) - LATER_FIELDS)
    if unknown:
        raise ValueError(f"unknown outcome record fields: {', '.join(unknown)}")
    assignments = ", ".join(f"{name} = %({name})s" for name in fields)
    sql = f"UPDATE outcome_records SET {assignments} WHERE record_id = %(record_id)s"
    params = dict(fields)
    params["record_id"] = record_id
    return sql, params
