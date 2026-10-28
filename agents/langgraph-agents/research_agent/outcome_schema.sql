-- Outcome record schema (Postgres) — outcome-record-spec.md.
--
-- One record per judgement, linked by candidate_id so re-judgements
-- of the same candidate stay visible — never a silent overwrite of
-- an earlier verdict. Later fields (human decision, real outcome)
-- fill in over time; earlier fields (signals, verdict) are never
-- rewritten to match the outcome (enforced by the writer in
-- outcome_record.py: updates touching verdict fields are refused).
--
-- Writers are the action layer (n8n / B1), not the reasoning agent:
-- the wiring leg pre-creates the record before the verdict is
-- finalized and passes its id into the run as outcome_record_id.
-- A pre-created row is filled exactly once by the writer's
-- build_verdict_fill_sql (verdict fields NULL-guarded); the single
-- INSERT builder is only for records with no pre-created row, and
-- later-field updates refuse verdict fields (see outcome_record.py).
--
-- Weak families and re-judgement links (fixed 2026-10-27):
-- weak_critical_families records the verify/evidence assessment's
-- weak/shaky critical flags (only that assessment may set them),
-- so a veto downgraded to an amber escalation is reconstructable.
-- prior_record_id links a re-judgement to the prior vetoed record;
-- the prior record is never overwritten, and the new record's
-- signals are the corrected signals.
--
-- Override re-check reference: when a veto is overridden, the human
-- decision fill records override_recheck_record_id and
-- override_recheck_checked_at from the verified re-check reference.
--
-- Product testing was REMOVED (Michael 2026-10-27, comment
-- 6460788465): there is no test-spend, sample-order, or ad-test
-- field in this schema. Shadow outcomes for skipped candidates are
-- "not listed" plus observation only — sales are never imputed.
--
-- No live database is touched by the team-work harness: this file is
-- checked as text and the writer is checked by the SQL it produces.

CREATE TABLE IF NOT EXISTS outcome_records (
    record_id UUID PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    judged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Judgement-time fields (append-only once written).
    signals JSONB,
    agreeing_families TEXT[],
    disagreeing_families TEXT[],
    vetoed_by TEXT[],
    score DOUBLE PRECISION,  -- #83 composite score, if one exists; else NULL
    verdict TEXT CHECK (verdict IN ('list', 'skip')),
    reasoning TEXT,
    confidence DOUBLE PRECISION,
    best_effort BOOLEAN,
    verified BOOLEAN,  -- True / False / NULL (no verifier wired)
    weak_critical_families TEXT[],  -- set only by the verify/evidence assessment
    prior_record_id UUID,  -- prior vetoed record, for re-judgements; else NULL
    -- Later fields (fill in over time).
    human_decision TEXT CHECK (human_decision IN ('approve', 'reject', 'edit', 'override')),
    human_reason TEXT,
    human_decider TEXT,
    real_outcome TEXT,  -- listed outcomes, or 'not listed' for pure SKIPs
    confounders JSONB,
    loser_actions JSONB,  -- auto-pauses + delist recommendations + decisions
    shadow_observation JSONB,  -- later signal re-check, observation only
    override_recheck_record_id TEXT,  -- verified re-check reference, veto overrides only
    override_recheck_checked_at TIMESTAMPTZ  -- timestamp of that re-check re-run
);

CREATE INDEX IF NOT EXISTS idx_outcome_records_candidate
    ON outcome_records (candidate_id, judged_at);
CREATE INDEX IF NOT EXISTS idx_outcome_records_verdict
    ON outcome_records (verdict);
CREATE INDEX IF NOT EXISTS idx_outcome_records_prior
    ON outcome_records (prior_record_id);
CREATE INDEX IF NOT EXISTS idx_outcome_records_human_decision
    ON outcome_records (human_decision);
