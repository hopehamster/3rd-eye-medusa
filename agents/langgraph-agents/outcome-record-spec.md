# Outcome record — spec (adopted field decision, Michael 2026-10-27,
#121 comment 6447160149 and #122 comment 6447160680)

## Purpose

One Postgres record per judgement, linking what the agent judged, what
the human decided, and what actually happened. This record is the
prerequisite for every later claim: threshold tuning, loser-rule
tuning, and any learning claim at all. Without it, the system would
learn human overrides as if they were agent judgements, and correlate
verdicts with sales without knowing whether the verdict caused them.

NO learning claim — about a signal, a weight, a threshold, a rule, or
the agent's accuracy — may be made before outcome records exist for
the candidates it is claimed about. A claim that cites verdicts
without their outcome records is not a learning result; it is an
anecdote.

## One record per judgement

A candidate judged more than once (re-evaluation, override listing,
later re-run) gets one record per JUDGEMENT, linked by candidate id
so the history is visible — never a silent overwrite of an earlier
verdict with a later one. The record is append-only in spirit: later
fields (human decision, real outcome) fill in over time; earlier
fields (signals, verdict) are never rewritten to match the outcome.

## Required fields

| Field | What is recorded | Why it must be separate |
|---|---|---|
| candidate | Candidate id + name/description, category, date judged | Identity; links re-judgements of the same candidate |
| signals | Every signal family with direction (agree/disagree/neutral), strength, checkable evidence, source | The evidence the verdict rested on, re-checkable later |
| agreeing_families | Families that agreed | The count-rule input |
| disagreeing_families | Families that disagreed, critical and soft | No disagreement hidden from later review |
| vetoed_by | Critical families whose disagreeing signal vetoed a LIST (empty if none) | Proves the veto rule was applied, not bypassed |
| weak_critical_families | Critical families flagged weak/shaky by the verify/evidence assessment only | Makes a veto downgraded to an amber escalation reconstructable, not prose-only; no other caller may set this |
| prior_record_id | Prior vetoed record id, for re-judgements of the same candidate | Links a corrected-signal re-run to its prior vetoed record; the prior record is never overwritten |
| score | The #83 composite score for the candidate, if one exists; otherwise null with "no score" stated | The default-path input, kept distinct from the agent verdict |
| verdict | Agent decision (list / skip), reasoning, confidence, best-effort flag, verification state (True/False/None), prompt/model versions, run/trace id | What the AGENT said — never merged with what the human did |
| human_decision | Approve / reject / edit / override, with reason, decider, and timestamp | What the HUMAN did — a distinct decision with its own reason; an override of a veto is recorded here, never as an agent LIST |
| override_recheck | For a veto override: the verified re-check reference (re-run record id + timestamp) | Proves the override carried a fresh re-check, not a bare boolean; recorded on the human decision fill, never as an agent field |
| real_outcome | Listed → sessions, add-to-carts, orders, refunds, returns, ad spend, supplier failures, delist date/reason if delisted; not-listed → outcome "not listed" (see shadow outcomes) | What ACTUALLY happened, on its own timeline |
| confounders | Price, creative/ad set, ad spend, seasonality/date, supplier/warehouse change, human listing edits | Without these, a "winner" may be a seasonal, creative, or price effect, not a verdict effect |
| loser_actions | Auto-pauses (rule trigger, date) and delist recommendations + human decisions on them | Loser rules tunable from evidence, not anecdote |

Product testing was REMOVED (Michael 2026-10-27, comment
6460788465): this record has no test-spend, sample-order, or
ad-test field. The system finds popular products; it does not test
whether they are popular.

## Writers — n8n / B1 own the writes

Writers are the action layer, not the reasoning agent: n8n workflows
and the B1 service leg write outcome records as candidates move
through judgement → human decision → listing → sales → fulfilment.
The agent itself does not own the record store; it supplies its
verdict (with `outcome_record_id` on the verdict schema) and the
wiring leg links verdict, human decision, and outcome to the same
record. Creation ordering, stated so the verdict id is never a
backfill: the wiring leg (n8n / B1) PRE-CREATES the record before
the verdict is finalized and passes its id into the run, so the
verdict carries `outcome_record_id` from the start; the verdict,
human decision, and real outcome are then filled into that same
record over time. The record is never created from the verdict
after the fact and backfilled. A verdict whose record was never
pre-created by the wiring leg is an incomplete run (see the
research spec's verdict contract), marked incomplete on the Verdict
itself, not only refused at the gate.

Fill path for a pre-created row (fixed 2026-10-27, Code Review
M5): a pre-created row (verdict fields NULL) is filled exactly once
by `build_verdict_fill_sql`, whose WHERE clause requires the verdict
fields still be NULL — a second fill matches no row, and the wiring
leg must check the affected row count is 1. `build_insert_sql` is
the single row creation only when no row was pre-created; it must
never be used on a pre-created record id (primary-key conflict).
`build_update_sql` fills later fields only and refuses verdict
fields. The three builders therefore agree: pre-created rows are
filled, never re-inserted and never verdict-updated.

Re-judgements (fixed 2026-10-27, Security M5): a re-judgement of a
vetoed candidate carries `prior_record_id` linking the prior vetoed
record, with its corrected signals retained on the new record. The
prior record is never overwritten, so a corrected-signal re-run is
distinguishable from a sanitized re-run (disagreeing signal dropped,
no prior link). Weak flags on any record come only from the
verify/evidence assessment; the wiring leg accepts weak flags only
from that assessment, never from any caller.

## Outcome latency

Sales, refund, and return outcomes arrive days to weeks after a
verdict. Do not update rules, thresholds, or weights on same-day
verdicts, and do not judge a verdict by its first-day numbers. A
record counts as outcome-complete only after its outcome window has
passed; until then it is verdict + human decision only, and any
aggregate over it must say so.

## Shadow outcomes for skipped candidates

A skipped candidate that is never listed has no sales to record, and
sales must NEVER be imputed for it. Its shadow outcome is defined
narrowly, so the "what would have happened" question stays honest:

- **Override / re-list cohort:** when a skipped candidate is later
  listed anyway — by human override, or by a later re-evaluation
  that lists it — its real outcome is recorded against the ORIGINAL
  SKIP verdict as well as against the listing decision. This cohort
  is the counterfactual evidence for whether SKIPs were right.
- **Pure SKIP cohort:** candidates never listed get outcome
  "not listed", plus a later signal re-check (supplier still live?
  trend persisted?) recorded as observation only. A persisted trend
  is not a sale, and must never be scored as one.
- **No invented counterfactuals:** competitor sales, trend
  persistence, or "would have sold" estimates are observations at
  most, never outcomes. A learning claim that treats an observation
  as a sale is a defect.

## Comparison / holdout rule

A learning claim requires a COMPARISON, not a before/after story:

- The agent-listed cohort is compared against the override /
  holdout cohort (candidates the agent skipped but a human listed,
  and vice versa where they exist), with confounders recorded for
  both sides.
- Cohort or before/after windows are the minimum; a single
  candidate's success, or a rising sales line after a rule change
  with no comparison group, proves nothing about the rule.
- Correlation between verdicts and sales is not evidence the
  verdict rule caused the sales. Any claim worded causally ("the
  veto rule improved sales", "signal X predicts winners") must
  name its comparison group and its confounders, or it is not made.
- Survivorship warning: listed products generate outcome data;
  skipped products mostly do not. Any aggregate that only looks at
  listed products is biased by construction and must say so.

## Schema + writer (team-work implementation, offline harness)

The Postgres schema is `research_agent/outcome_schema.sql` and the
writer core is `research_agent/outcome_record.py` (pure functions
building parameterized SQL; the wiring leg executes it — no live
database in the harness). Writers remain n8n/B1; the agent supplies
its verdict only, and the record is pre-created before the verdict
is finalized so the verdict carries `outcome_record_id` from the
start. Updates touching verdict fields are refused by the writer:
earlier fields are never rewritten to match the outcome. A skipped
candidate's shadow outcome is "not listed" plus observation only;
sales are never imputed for it.

## What this spec does NOT do

This spec defines the record and the claim bar. It does not set
thresholds, budgets, windows, or sample percentages (all placeholders
tuned from outcomes, per the research spec); it does not authorize
any spend, auto-apply any learning, or auto-delist any listing; and
it does not redefine the store — schema, migrations, and writers
must satisfy this spec's field list, not redefine it.
