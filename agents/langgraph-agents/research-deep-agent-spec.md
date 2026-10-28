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
3. **analyze** — applies the veto check first, then the 3-signal rule,
   and drafts reasoning.
4. **verify** — re-checks the strongest claims (supplier still live? margin
   math recomputed? ad still running?). On failure, reflect and retry.
5. **verdict** — list-or-skip with reasoning, confidence, the agreeing
   and disagreeing families named, `vetoed_by`, and `outcome_record_id`.

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
count as one. Two agreeing families = SKIP, however strong.

## Veto rule (adopted field decision, Michael 2026-10-27, #121 comment
6447160149 and #122 comment 6447160680 — supersedes the earlier
"name it in the reasoning" treatment of critical disagreement)

A disagreeing `supplier_proof` or `margin_math` signal VETOES a LIST.
It is never outvoted by trend signals and never merely named while
listing anyway. The veto and the 3-signal count compose in this order,
with no contradiction between them:

1. **Veto check first, on the final signals at verdict time.** If any
   `supplier_proof` or `margin_math` signal has direction `disagree`
   with checkable evidence, the agent verdict is SKIP — however many
   other families agree, even if three or more agree. The count rule
   decides LIST-eligibility only among candidates that pass the veto
   check; it cannot override a veto.
2. **What counts as a vetoing signal.** A disagreeing critical signal
   with evidence (supplier not live, stock/MOQ/lead-time failure, or
   margin math that does not clear costs). A `neutral` / "no evidence
   found" critical signal is NOT a veto — it is a missing family,
   named as such; the count rule then decides (fewer than 3 agreeing
   families = SKIP). A disagree direction returned without checkable
   evidence is treated as missing/neutral, not as a veto: neutral
   already covers "no evidence found", so an evidence-less disagree
   is named as a missing family and the count rule decides — it
   neither vetoes nor counts as agreement. Evidence bar (Michael
   2026-10-27, comment 6460788465): a weak/shaky bad signal
   escalates to Michael through the amber queue — it is not an
   automatic no; a strong bad signal with checkable evidence stays
   an automatic no (veto-SKIP). Signal strength alone does not
   soften a veto: strength is a score, not an evidence assessment,
   and no strength cutoff was set — a critical disagreement counts
   as weak/shaky only when the verify/evidence assessment flags
   it as such (see `decide_verdict`'s `weak_critical_families`
   input), and that flagged signal escalates rather than vetoing.
3. **Verify can lift a veto only by correcting the signal.** If the
   verify node re-checks and the critical claim no longer holds
   (supplier live again, margin math recomputed and passing), the
   signal is corrected to agree/neutral and the veto lifts on the
   corrected signal — that is a new verified fact, not an override.
   If verification fails or is exhausted, the veto STANDS and the
   best-effort verdict is SKIP, marked with the veto and the
   unverified status. A veto is never lifted by reasoning alone.
4. **Human override is the only path past a veto, and it is not an
   agent decision.** Override is Michael ONLY, with a fresh
   supplier/margin re-check attached (Michael 2026-10-27, comment
   6460788465). No other approver, never a gut-feel override: an
   override without Michael as decider, without a fresh re-check
   that passed, or without a reason is refused in code (see
   `research_agent/approval.py`, B2-8). A Michael override is an
   explicit, logged human decision with a reason (recorded in the
   outcome record — see below), never an agent verdict. That
   decision is taken through the amber queue with the full veto
   card (see Approval-queue tiering below) — one approval
   mechanism, not a second path outside the queue. The agent's
   verdict over a veto is SKIP, with the vetoing family, its
   evidence, and the count that would otherwise have applied all
   named in the reasoning.
5. **Soft conflicts are named, not vetoed.** Disagreement among
   non-critical families (e.g. two trend sources disagree, or trend
   is strong but confidence is middling) does not veto. It must be
   named in the reasoning of any verdict, with the disagreeing
   families and evidence, so the human approver sees it — not buried
   in a trace. Naming a soft conflict never substitutes for the
   veto rule above.

**Scope — the veto binds the default path too (CONFIRMED).**
The veto is not escalation-path-only. The automatic no for a bad
supplier or bad margins applies to BOTH the quick everyday check
and the deep-dive check — confirmed by Michael 2026-10-27
(comment 6460788465), which confirms the fold summary's "adopted
interpretation" label. The default path (#83 composite score plus
one LLM judging step) is bound by the same rule: the default judge
may not deliver a LIST over a disagreeing `supplier_proof` or
`margin_math` signal with checkable evidence. Once the router's
conflict trigger fires, the escalation verdict governs — a
veto-SKIP from this path stands, and the default verdict does not
override it.

## Verdict schema

```json
{
  "product": "candidate name/description",
  "decision": "list | skip",
  "agreeing_families": ["social_velocity", "search_demand", "margin_math"],
  "disagreeing_families": ["supplier_proof"],
  "vetoed_by": ["supplier_proof"],
  "reasoning": "3 independent families agree (...); 3 required. ...",
  "confidence": 0.0,
  "requires_human_approval": true,
  "outcome_record_id": "id of the outcome record for this candidate",
  "weak_critical_families": ["supplier_proof"],
  "prior_record_id": "id of the prior vetoed record, for re-judgements",
  "incomplete": false
}
```

`vetoed_by` lists every critical family whose disagreeing signal vetoed
a LIST (empty when no veto applies). `disagreeing_families` lists all
disagreeing families, critical and soft, so no disagreement is hidden
from the human approver. A verdict with a non-empty `vetoed_by` MUST
have `decision: "skip"` — an agent LIST verdict with a veto is a
defect, not a judgement call. `weak_critical_families` lists the
critical families flagged weak/shaky by the verify/evidence
assessment only (never a general caller flag) — persisted here and in
the outcome record so a veto downgraded to an amber escalation is
reconstructable. `prior_record_id` links a re-judgement to its prior
vetoed record; corrected signals are retained on the new record and
the prior record is never overwritten, so a corrected-signal re-run
is distinguishable from a sanitized re-run. `incomplete` is true
when `outcome_record_id` is missing, marked on the Verdict itself
(with an errors entry in the graph run), not only refused at the
gate.

## Human-approval gate (hard)

Every verdict, including LIST, has `requires_human_approval: true`.
Nothing from this agent touches the catalog or order flow until a human
approves that specific verdict. The gate is a field on the verdict, not a
prompt instruction — downstream code must check it. See
`design-review-record.md` for the B2-8 code requirement that makes
this check enforceable rather than paper-only.

Gate rules in code (`research_agent/approval.py`, B2-8; fixed
2026-10-27 against the code/security review blocks):

- The gate never trusts the verdict's own `requires_human_approval`
  flag. Every LIST write requires a matching approval regardless of
  the flag; flag False with no approval is refused.
- A non-veto LIST passes only on a matching record with
  kind `approve`, a non-empty approver, and a non-empty reason. A
  kind `review` record is a review, not an approval, and is refused.
  The same rule applies to state-change actions.
- A veto override passes only on Michael-only authority proven by
  authenticated identity: the wiring leg sets a verified approver id
  only from an authenticated session, and supplies the set of
  verified ids its identity store maps to Michael; a bare approver
  name of "michael" never passes, and no override passes without the
  mapping supplied (fail closed). No auth system is invented here —
  the wiring leg owns the authenticated session and the mapping,
  and must never derive the verified id from the name string.
- A veto override must carry a structured re-check reference
  (re-run record id + timestamp + passed), validated structurally
  by the gate and verified by the wiring leg against the real
  re-run record (existence, passing signals, freshness under the
  owner-set rule) before the Approval is minted. A bare boolean
  re-check flag is ignored by the gate and never passes an override.

Wiring-leg requirements (Security W1/W3/W4 — requirements, not a
claim that anything is protected): no production call site exists in
team-work (the gate is called only in tests), so no write is
"protected" yet. Before any live write relies on this gate, the
wiring leg must call the gate before every catalog/order/money
write and fail closed on refusal. Before sampled green-audit mode is
used, the owner must define and record in writing the proven
criteria (what counts as proven, with evidence), the owner sign-off
(who signed, when), and the sample rate (owner-set, no percentage
invented here); an audit error reverts green to full (amber)
review until the cause is fixed. A verdict with
`outcome_record_id` None is marked incomplete on the Verdict
itself (flag plus graph errors entry) and refused at the gate, so
it cannot sit silently unapprovable in a queue.

## Outcome record — required for every candidate (adopted 2026-10-27)

Every candidate this agent judges MUST have an outcome record, as
specified in `outcome-record-spec.md` (one Postgres record per
judgement: signals, agreeing families, score, verdict, human decision
+ reason, real outcome, confounders). The wiring leg (n8n / B1)
pre-creates the record before the verdict is finalized and passes
its id in, so the verdict carries `outcome_record_id`. The verdict
contract requires it: a run that produces a verdict without its
pre-created, linked outcome record is incomplete, even if the
verdict itself is well reasoned. The record is what makes the veto rule, the threshold
tuning, and any later learning claim checkable — without it, the
system would learn human overrides as if they were agent judgements.
NO learning claim (about a signal, a weight, a threshold, or the
agent's accuracy) may be made before outcome records exist for the
candidates it is claimed about.

## Approval-queue tiering — LIST never auto-approves

Queue tiers apply to lower-risk steps only. They never silently
auto-approve a LIST:

- **Red — hard block, never enters the queue as an approvable item.**
  Machine pre-gates fail here: a vetoed candidate, a critical-check
  failure, a missing required identifier, or a failed verification
  that leaves a critical claim unresolved. A red item is not
  approvable in the red tier; the only path past a veto is a human
  override decision taken through the amber queue with the full
  veto card (see Amber) — a recorded human decision, never a code
  conversion of a SKIP into a LIST and never an agent verdict.
  Override is Michael-only with a fresh supplier/margin re-check
  attached (see the veto rule above); no other approver may
  exercise it. Tier agreement, stated precisely so code and spec
  cannot be read two ways: `queue_tier()` tiers the verdict, and a
  vetoed verdict tiers red; the override decision is a separate
  queue item that tiers amber (`override_queue_tier()`). The
  verdict tiers red and the override item tiers amber — both
  statements hold, about different items.
- **Amber — async human queue.** Every LIST verdict, every human
  override (of a veto or of a SKIP), every weak/shaky critical
  disagreement escalated to Michael, every delist recommendation,
  and every money recommendation. Amber items carry the full
  approval card: signals, agreeing and disagreeing families,
  veto status, margin math, and reasoning inline, so review stays
  fast without becoming rubber-stamping.
- **Green — auto-approved low-risk steps only.** Routine SKIPs (no
  action follows), internal record writes, and trace/dataset
  promotion. A veto-SKIP is NOT a green item: a vetoed candidate is
  Red (hard block), even though its agent verdict is a SKIP; green
  covers routine SKIPs only (no veto, no critical failure, no
  weak/shaky critical disagreement). Green NEVER covers a LIST, a
  catalog write, a money action, or a delist. Green auto-actions
  are subject to audit (green-tier routine decisions re-reviewed
  by a human): 100% of green-tier routine decisions are reviewed
  at first, dropping to a sample only once the audit process is
  proven (Michael 2026-10-27, comment 6460788465). If the audit
  finds errors, green reverts to amber review until the cause is
  fixed. No sample percentage is set by this spec — the percentage
  after proving is an owner-set value, not a field standard.

Batching similar candidates for review is allowed; batch approval
that hides an individual candidate's veto, disagreement, or margin
math is not.

## Loser rules — ad sets auto-pause, listings recommend-only

Loser handling is split, and the split is the rule (adopted
2026-10-27; field consensus for ad auto-pause, emerging practice
for recommend-only delisting). These rules live HERE, in the
research/verdict spec, because this agent owns the list/skip
lifecycle; the fulfilment-exception agent owns single failed
orders, not product lifecycle, so it does not own loser decisions
(it cross-references this section only — see its spec).

- **Ad sets — auto-pause is allowed, with guards.** An underperforming
  ad set may be auto-paused by a written, human-approved rule that
  code checks (not by model judgement). Guards, all required:
  minimum-data window (no judgement before the written rule's
  minimum data and minimum window have both passed, and never
  while the ad set is still in its learning phase); a staged
  ad-set pause shape (no sales / no signal over the window pauses
  the ad set; add-to-carts without purchases iterates on
  price/checkout first, it does not pause on the same rule); and a
  seasonality guard (a seasonal product is not paused in an
  off-season trough without a year-on-year check). This guard
  applies to an already-listed ad set under a human-approved
  written rule, and authorizes no test budget: there is no
  product testing and no test budget in this system (Michael
  2026-10-27, comment 6460788465). No spend, window, or conversion figure is
  set by this spec — each is an owner-set placeholder in the
  written rule, tuned from outcomes, never a field-standard number.
- **Listings — recommend-only + human gate, never auto-delist.** A
  listing is never auto-delisted on a short window. The agent (or
  the rule) RECOMMENDS delist with evidence and reasoning, and a
  human decides. Reasons: a listing costs little to keep live
  compared with ad spend burning daily, and delisting destroys
  accumulated reviews and ranking — a stronger, less reversible
  action than pausing an ad set. The same seasonality guard applies:
  purely seasonal listings end after the season by human decision,
  evergreen listings keep running unless a human delists them.
- **Loser outcomes feed the outcome record.** Every auto-pause and
  every delist recommendation, with its rule trigger and its real
  outcome, is recorded against the candidate's outcome record, so
  loser rules are tunable from evidence rather than from anecdote.

## Learning — propose-only, behind eval gates

Learned changes (signal reweights, threshold changes, rule
refinements) are PROPOSE-ONLY to a human. No silent auto-apply, and
no auto-apply of reweights at all in this phase. A proposal that
passes human review is promoted only through eval gates, in order:
offline evals (golden set + safety set + regression comparison
against current production, blocking on any critical drop) →
shadow traffic (candidate runs silently, output not served) →
small external canary → staged ramp → full rollout, with an
instant rollback path (repoint a label/tag, not a redeploy) and
prompt/model versions logged per request. Until the outcome record
exists and an eval set is built from it, there is nothing to
promote — proposals wait.

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
- **high_spend**: DEFERRED. `estimated_spend_usd` is an optional
  placeholder only (Michael 2026-10-27, comment 6460788465:
  estimated spend is deferred, playing by ear, left undefined).
  It has no threshold, triggers nothing, blocks nothing, and is
  defined nowhere — do not invent a definition or a figure for it.
- **first_pass_verification_failed**: `first_pass_verified` is False —
  the default path's own first-pass verification did not pass.

Trigger values above (other than the deferred spend placeholder)
are PLACEHOLDERS made so the gate is
implementable and testable; they are reviewable numbers, not
Michael-approved thresholds and not field-standard numbers — the
field has no standard number for any of these triggers. Tuning
method (adopted 2026-10-27): set each cutoff where the cost of
escalating balances the cost of being wrong (a cheap escalation
with an expensive error escalates readily; an expensive escalation
with a cheap error does not), then retune from observed overrides
and real outcomes once outcome records exist. Retune them by
changing router.py and its tests together, never by rewording this
section, and never by copying a figure from a field guide as if it
were a standard. Running a planning +
sub-agent + long-context loop on every candidate would be
over-engineering; running it where judgment is actually contested is
where it earns its cost.

Note on the escalation gate and the veto rule: the router's
`conflict` trigger (a disagreeing critical signal, or at least 2
disagreeing signals) already routes veto candidates into this
escalation path — the veto rule above then governs what verdict
that path may deliver. Routing a candidate here does not soften its
veto; it is how the veto gets judged with full evidence. The veto
binds the default judge as well (CONFIRMED, Michael 2026-10-27,
comment 6460788465 — see the veto Scope paragraph above): the default path may not deliver
a LIST over a vetoing critical signal, and once the conflict route
triggers, the escalation verdict (veto-SKIP) governs — the default
verdict does not override it.

## Confidence is informational only (B2-3)

`Verdict.confidence` is the mean strength of agreeing signals. It never
gates LIST: LIST depends on passing the veto check first and then on
the agreeing-family count. A low-confidence LIST (three weak agreeing
families, no veto) is a valid verdict with weak evidence, not a
blocked one — the weakness is visible in the confidence value and in
the reasoning, for the human approver to weigh.

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
