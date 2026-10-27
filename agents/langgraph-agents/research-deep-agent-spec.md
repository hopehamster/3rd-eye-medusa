# Winning-product research deep agent — spec (issue #122, child of #121)

## Architecture in one line

n8n stays the ACTION layer (schedules, webhooks, API calls, the fulfilment
pipe). LangChain/LangGraph is the BRAIN layer: this agent reasons; n8n
workflows move data and act. The agent runs as a Python service (B1's leg)
triggered by n8n webhooks; it calls back into n8n workflows as tools
(n8n webhooks as tool endpoints). State in Postgres with checkpointing.

## The job

Scout signals → analyze → verify → score → list-or-skip verdict with
reasoning. One research run covers ONE candidate product and ends with
exactly one verdict. It never lists, orders, or publishes anything itself.

## Nodes (graph.py implements this order; langgraph_adapter.py is the seam)

1. **plan** — writes an explicit plan (candidate, families to scout, what
   would count as proof) BEFORE any scout/tool call. No plan, no scouting.
2. **scout** — fans out one sub-agent per signal family, in parallel where
   the runtime allows. Sub-agents return `Signal` objects, never free text
   alone: family, direction (agree/disagree/neutral), strength 0–1,
   checkable evidence, source.
3. **analyze** — applies the 3-signal rule and drafts reasoning.
4. **verify** — re-checks the strongest claims (supplier still live? margin
   math recomputed? ad still running?). On failure, reflect and retry.
5. **verdict** — list-or-skip with reasoning, confidence, and the agreeing
   families named.

## Sub-agents, one per signal family

| Family | Job | Example evidence |
|---|---|---|
| social_velocity | Is it spreading, and how fast? | post counts, view velocity, creator count over 7/30 days |
| ad_longevity | Are sellers still paying to push it? | ad run duration, active ad count, creative refresh |
| search_demand | Are buyers looking for it? | search volume trend, query growth |
| supplier_proof | Can we actually source it reliably? | live supplier listing, stock, lead time, MOQ |
| margin_math | Does the money work after all costs? | landed cost, fees, shipping, target margin % |

Sub-agents are scoped: each reports only its own family, with evidence a
human (or the verify node) can re-check. A sub-agent that cannot find
evidence reports neutral with "no evidence found" — never an invented
number.

## What counts as a signal — and what does not

COUNTS: a dated, checkable observation from an independent source
(a live listing, a counted post set, a price quote, a search trend).
DOES NOT COUNT: a vibe ("feels hot"), a single anecdote, a screenshot
with no source, another agent's verdict restated without its evidence,
or three observations from the same source counted three times.

## The 3-signal rule (enforced in rules.py, not by prompt hope)

At least **3 independent signal families** must agree before a product
may be listed. Independence is by family: three social-velocity signals
count as one. Two agreeing families = SKIP, however strong. Disagreement
does not veto by itself, but a disagreeing supplier_proof or margin_math
signal must be named in the reasoning of any LIST verdict.

## Verdict schema

```json
{
  "product": "candidate name/description",
  "decision": "list | skip",
  "agreeing_families": ["social_velocity", "search_demand", "margin_math"],
  "reasoning": "3 independent families agree (...); 3 required. ...",
  "confidence": 0.0,
  "requires_human_approval": true
}
```

## Human-approval gate (hard)

Every verdict, including LIST, has `requires_human_approval: true`.
Nothing from this agent touches the catalog or order flow until a human
approves that specific verdict. The gate is a field on the verdict, not a
prompt instruction — downstream code must check it.

## Reflection / retry bounds

Verify retries at most `max_attempts` (default 3). On exhaustion the graph
delivers a **best-effort verdict** (marked as such in reasoning) — it
never hangs and never fails with no answer.

## Escalation gate (coordinator amendment to #122 — ESCALATION-ONLY)

The #83 composite score plus one LLM judging step is the DEFAULT path:
cheaper and more reliable for routine candidates. This deep agent is the
ESCALATION path, and it runs ONLY where judgment is contested. The gate
is implemented, not prose: `research_agent/router.py` (`decide_route`,
`route_from_signals`) decides from quantified triggers, and
`tests/test_router.py` proves each trigger and its boundary:

- **conflict**: a disagreeing signal in supplier_proof or margin_math
  (critical families), OR at least 2 disagreeing signals in total. One
  non-critical disagreement alone does NOT escalate.
- **novelty**: `has_score_history` is False — the category/product has
  no prior composite-score history to judge against.
- **high_spend**: `estimated_spend_usd >= 500` (SPEND_THRESHOLD_USD).
- **first_pass_verification_failed**: `first_pass_verified` is False —
  the default path's own first-pass verification did not pass.

Trigger values above are fix-pass quantifications made so the gate is
implementable and testable; they are reviewable numbers, not
Michael-approved thresholds — retune them by changing router.py and its
tests together, never by rewording this section. Running a planning +
sub-agent + long-context loop on every candidate would be
over-engineering; running it where judgment is actually contested is
where it earns its cost.

## Confidence is informational only (B2-3)

`Verdict.confidence` is the mean strength of agreeing signals. It never
gates LIST: LIST depends on the agreeing-family count alone. A
low-confidence LIST (three weak agreeing families) is a valid verdict
with weak evidence, not a blocked one — the weakness is visible in the
confidence value and in the reasoning, for the human approver to weigh.

## Scout fan-out, validation, and verification states (B2-5, B2-7)

- Scouts fan out in parallel where the runtime allows (ThreadPoolExecutor
  in `graph.py` and in the LangGraph adapter's scout node), gathered in
  submission order so signal order is deterministic. Scouts must be
  thread-safe; `parallel=False` runs them sequentially.
- Scout dict keys MUST be known signal families (unknown keys raise).
  A scout returning a signal for a different family than its key has
  that signal QUARANTINED (dropped + recorded in state.errors).
  Families with no scout are recorded in `state.missing_families` and
  named in the analysis — a subset run is allowed, a hidden gap is not.
- Signal families are validated at construction (`Signal` rejects
  unknown families): a typo cannot manufacture a LIST.
- Verification states are three-valued: True (verifier passed), False
  (verifier ran and failed — best-effort verdict), None (no verifier
  wired — UNVERIFIED, never reported as verified). Planner/scout/
  verifier exceptions are recorded in `state.errors` and the run still
  produces a verdict; "always a verdict" holds because failures are
  recorded, not propagated.

## Wiring seam — B1 owns integration (reviewer's design question)

B1's service leg owns checkpoint creation (pooled PostgresSaver +
`setup()` first-use step) and tool execution (n8n-webhook calls with
retry/validation). This leg CONSUMES them: `langgraph_adapter.
build_langgraph_graph` accepts a `checkpointer` argument and scouts wired
to B1's `execute_tool`. There is exactly one integration shape; a second
one is a defect, not a variation.

## What this leg does NOT do

No real LLM calls, no live tools, no service hosting — that is B1's leg.
This skeleton runs on injected, mocked scouts only.
