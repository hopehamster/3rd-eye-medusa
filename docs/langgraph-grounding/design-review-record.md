# Design review record — first agent: winning-product research deep agent (#122)

## Home choice (recorded)

This record lives in `b3-grounding/` (not `b2-agent/`), alongside
`core-discipline.md`, because issue #128's done condition is a property
of the DISCIPLINE's citation, not of B2's code: the discipline file and
the record that cites it belong together, and the reviewer reads them as
a pair. B2's code and spec stay in `b2-agent/`; this record points at
them, it does not duplicate them.

## Status — stated plainly

This record is derived from the FIXED designs (Fix Agent B pass,
2026-10-27): B1's pooled checkpoint + validated tool execution, and
B2's real LangGraph graph with bounded retry, router, and verdict
rules. It is a design record, not a live proof: nothing here is claimed
deployed, live, or proven against a real service or live tool. What
closes #128 is THIS record containing the four items
`core-discipline.md` §7 requires — the §3 four-part answer, the §4
per-action gates, the §5 checkpointer + retention choice, and the §6
retry bounds + verdict shape. A citation of the discipline's title
without these four records would not have satisfied #128.

The agent under review is ESCALATION-ONLY (coordinator amendment to
#122): the #83 composite score plus one LLM judging step is the default
verdict path, and this graph runs only where the router
(`b2-agent/research_agent/router.py`) fires. That scoping is part of
the §3 answer below, not an afterthought.

## §3 — "Does the graph earn its complexity over an n8n workflow?"

Written answer, all four parts (core-discipline.md §3):

1. **What branches on model judgement (not on fixed rules).**
   Inside an escalated run: each scout's direction judgement per signal
   family (agree/disagree/neutral with strength + evidence); the
   verifier's pass/fail judgement on the strongest claims, which drives
   the conditional verify→verify/verdict edge; and the verdict node's
   reasoning synthesis over agreeing AND disagreeing families. The
   escalation router itself is deliberately NOT model judgement — it is
   deterministic rules (conflict/novelty/spend/verification triggers) —
   so the graph is entered on a rule and reasons with judgement inside.
   If nothing branched on judgement, this graph would fail the question;
   here the retry routing and the verdict synthesis do.
2. **What state must survive across steps, pauses, or crashes that an
   n8n execution does not already carry.** The graph thread's own state:
   per-family signals (with quarantine status), the verify attempt count,
   the best-effort flag, the three-valued verification state
   (True/False/None), recorded errors, and the verdict — across verify
   retries, across a human-approval pause (interrupt + resume on the
   same thread), and across a process crash/restart. An n8n execution
   carries workflow state between ITS nodes; it does not carry this
   reflection loop's state (attempts, best-effort flag, per-family
   signal accumulation) in a form the graph can resume from.
3. **What the graph costs that the n8n workflow would not.** A second
   runtime (the B1 FastAPI service) to operate and observe; a Postgres
   checkpointer to operate (pooled connections, a setup step, a prune
   job — see §5); checkpoint growth to bound; the LangGraph dependency
   itself (pinned: langgraph 0.2.45 in B1's venv); and a second test
   surface (real-graph tests must run under B1's venv, since the
   stdlib-only interpreter cannot build the graph).
4. **The n8n-only alternative considered and why it was rejected.**
   A fixed n8n node sequence with IF-node retry loops COULD loop a
   fixed number of times — the rejection is not "n8n cannot loop." It
   is that the judgement loop (verifier-conditioned routing, per-family
   signal accumulation with wrong-family quarantine, best-effort
   verdict synthesis naming disagreeing families) would live as
   unversioned visual nodes and Code-node snippets that the team cannot
   unit-test offline. The specific step n8n cannot express AS TESTED
   CODE is the conditional verify→verify/verdict edge driven by a
   verifier judgement over accumulated graph state, with the same logic
   proven by the pure-Python tests and the real-graph tests. Versioned,
   offline-testable graph code is what the graph buys; that is the
   whole justification, and it holds only for the escalation path —
   routine candidates stay on the cheaper composite+judge path.

Verdict on §3: the graph earns its complexity FOR THE ESCALATION PATH
ONLY. As an every-candidate path it would fail this question on cost.

## §4 — Per-action money gates (core-discipline.md §4)

One gate per action, stated explicitly. No action below runs on model
judgement alone. Rule-gated execution is NOT used anywhere in this
phase (coordinator decision on #125); where a rule gate would have
been the alternative, the gate is human approval instead.

| Action | Gate (this phase) | How it is enforced / where |
|---|---|---|
| LIST verdict → any catalog write | HUMAN APPROVAL. The verdict is a recommendation only; `requires_human_approval: true` on every verdict, and wired downstream code MUST check it before any catalog/order write. | Verdict field (B2) + wiring-leg check (B1) — the check itself is a CODE REQUIREMENT (B2-8, see below), not a spec sentence. Until that check exists in wired code, the gate holds on paper only. |
| SKIP verdict → anything | NO ACTION. A SKIP recommends nothing and touches nothing. | By construction (verdict only). |
| Tool calls to n8n webhooks (scout/verify data gathering) | NO MONEY ACTION in the call itself; calls are authenticated per tool (env Authorization header), URL-validated (https, allowlist, DNS-resolved IP block), and idempotency-flagged per tool. | B1 `tools.py` (fixed). |
| Fulfilment retry / refund (from #125 recommendations) | RECOMMEND-ONLY. The fulfilment agent recommends retry/refund/alert; a HUMAN executes any money action. Rule-gated execution is a later, separately approved scope, not this build. | #125 spec (fixed B2-6) + human execution. |
| Oracle answers (#123) | READ-ONLY tools only. The Oracle agent never refunds, cancels, reorders, or changes anything. | Spec prohibition; writes go to the fulfilment path with its own gates. |
| Dev agent changes (#124) | HUMAN REVIEW before merge. The agent never grades its own work final, never pushes, merges, or deploys. | Spec rule + wiring-leg enforcement requirement (B2-8). |
| Checkpoint writes | NOT a money action; no §4 gate applies. Durability is a §5 matter. | — |

Side-effect ordering (interrupt rule): any future interrupt-gated
action MUST place the side effect AFTER the `interrupt()` — never
before it, since the node re-runs from its start on resume and a
pre-gate side effect would execute twice. The effect itself must still
be idempotent. No interrupt-gated action exists in the current graph;
this rule binds the wiring leg when one is added.

## B2-8 — approval-gate wiring as a CODE REQUIREMENT (adopted
2026-10-27 fold)

The gate was paper-only: a field on the verdict plus a spec sentence
saying downstream code must check it. This record now REQUIRES the
check in code — describing the gate is no longer sufficient, and no
issue in this tree may be closed on the spec alone while the check
is unwired. The wiring leg MUST implement all of the following:

1. **The check:** before any catalog write, order write, or other
   state-changing action driven by a verdict, wired code checks
   that a human approved THAT specific verdict (matched by verdict
   / run id, not by product name or by "a human approved something
   recently"). If the check finds no such approval, the action is
   REFUSED, the refusal is logged, and nothing is written.
2. **The refusal test:** a test proving refusal without approval
   (verdict with `requires_human_approval: true` and no human
   approval → action refused, catalog unchanged) and a test proving
   passage with approval (same verdict + recorded approval → action
   proceeds). Both tests must pass in the wiring leg's suite; a
   gate with only the passage test is unproven.
3. **Veto + override handling in code:** a vetoed candidate's SKIP
   verdict is the agent output; a human override LIST is a separate
   recorded human decision (with reason) decided through the amber
   queue with the full veto card — the same single approval
   mechanism as every other override, not a path outside the queue
   — that the check matches against, never a re-interpretation of
   the agent verdict. Code must not convert a vetoed SKIP into a
   LIST on its own. Override is Michael ONLY, with a fresh
   supplier/margin re-check attached (Michael 2026-10-27, comment
   6460788465); implemented in `research_agent/approval.py` and
   reached from the B1 leg via `b1-service/app/approval_gate.py`,
   with refusal and passage tests in both suites. Fixed 2026-10-27
   against the code/security review blocks: the gate never trusts
   the verdict's own `requires_human_approval` flag (every LIST
   write needs a matching approval regardless); a non-veto LIST
   passes only on kind `approve` with a non-empty approver and
   reason (a `review` record is refused); Michael-only means a
   verified approver id set by the wiring leg only from an
   authenticated session, in the wiring leg's id-to-Michael
   mapping — a bare name never passes and no override passes
   without the mapping (fail closed), and no auth system is
   invented here; the re-check is a structured reference (re-run
   record id + timestamp + passed) verified by the wiring leg
   against the real re-run before the Approval is minted, and a
   bare boolean re-check flag is ignored by the gate. Tier
   agreement: the vetoed verdict tiers red (`queue_tier`), the
   separate override-decision item tiers amber
   (`override_queue_tier`) — different items, both statements hold.
   A verdict with no outcome record id is marked incomplete on the
   Verdict itself and refused at the gate. Wiring-leg requirements
   (not a claim of protection — no production call site exists in
   team-work): the gate must be called before every
   catalog/order/money write and fail closed on refusal; green
   sampled audit requires owner-recorded proven criteria + owner
   sign-off first, with revert to full review on audit errors.
4. **Scope:** the same check shape applies to the #123 oracle path
   (no state-changing action without the human gate) and the #124
   dev path (no merge/deploy without recorded human review) — the
   wiring leg implements the check once per action surface, not
   once per spec sentence.

Items 1–2 now exist in wired team-work code and pass in the
suites (`research_agent/approval.py` + `tests/test_approval.py`,
and the B1 adapter `b1-service/app/approval_gate.py` +
`tests/test_approval_gate.py`), so the "holds on paper only"
qualifier is lifted for the check itself. That is team-work
code + offline tests, not live-service proof: no live catalog,
order, or merge action has been gated by it yet, and that proof
remains a QA / fact-check leg, not a claim made here.

## Approval-queue tiers (adopted 2026-10-27 — detail in the research
spec)

Tiers apply to lower-risk steps only; they never auto-approve a
LIST. Red = hard block (veto, critical-check failure, unresolved
verification) that never enters the queue as an approvable item in
the red tier; the only path past a veto is a human override
decision taken through the amber queue with the full veto card —
a recorded human decision, never a code conversion of a SKIP into
a LIST and never an agent verdict. Amber = async human queue
(every LIST verdict, every override, every delist recommendation,
every money recommendation) with the full approval card inline.
Green = auto-approved low-risk steps only (routine SKIPs,
internal record writes, trace/dataset promotion) with audit at
100% at first, dropping to a sample only once the audit process
is proven (Michael 2026-10-27, comment 6460788465), and revert
to amber on audit errors; a veto-SKIP is NOT a green item — a
vetoed candidate is Red, and green covers routine SKIPs only
(no veto, no critical failure, no weak/shaky critical
disagreement); green never covers a LIST, a catalog write, a
money action, or a delist. Machine pre-gates run before the
queue: an item that fails a pre-gate is denied, it does not wait
in the queue for a human to catch it. Override is Michael-only
with a fresh re-check attached (see B2-8 item 3 above).

## Tracing scope — free tier (adopted 2026-10-27)

Tracing is sampled and scoped to the runs that matter, not turned
on for everything, because the free tier is bounded (LangSmith
Developer free tracing; overage figures in secondary sources
conflict and must be verified on LangChain's pricing page before
any cost is modelled or relied on). Scope, as a design requirement
for the wiring leg:

- **Trace:** the agent's list/skip judgement runs, in a dedicated
  prod project — not n8n signal-gathering loops, not dev iterations.
- **Always keep (tail-keep, implemented app-side):** runs that are
  errors, low-confidence, signal-conflicted, vetoed, human-overridden,
  or that later become listed products. LangSmith provides a
  sampling knob, not a documented tail sampler, so keeping every
  important run is app-side work (always trace those runs via a
  tracing context), not a LangSmith setting to assume.
- **Sample the rest:** routine unanimous SKIP / routine approve runs
  are random-sampled for a baseline. No sample percentage is set
  here — the field has no consensus figure; the rate is set to fit
  the free-tier trace budget and tuned from volume, not copied
  from a guide.
- **Archive before retention expires:** important traces are
  promoted to a dataset / exported before the retention window
  ends, otherwise the verdict-to-outcome link the outcome record
  depends on is lost. Tag runs (verdict, conflict flag, veto flag,
  human decision) so the important ones are findable for that
  promotion.

Tracing and gating status: the tracing scope above is a design
requirement, not a running setup; the prune job in §5 is likewise
recorded, not built. Neither may be quoted as operating until the
wiring leg builds it and QA checks it.

## §5 — Checkpointer + retention choice (core-discipline.md §5)

- **Checkpointer:** durable PostgresSaver (NOT in-memory) for any run
  that can pause, wait on a human, run long, or resume later.
  Construction is B1-owned: a real `psycopg_pool.ConnectionPool` with
  env pool bounds (defaults min 1 / max 10) passed to
  langgraph-checkpoint-postgres 2.0.16 `PostgresSaver`. In-memory
  `MemorySaver` is tests/development only — it loses everything on
  restart and is never a production choice.
- **First-use step:** `setup_postgres_saver()` once, after the pool is
  open and before the first graph invocation (creates/migrates
  checkpoint tables). The wiring leg owns this call and pool
  open/close at startup/shutdown.
- **Short-term vs long-term, kept separate:** the checkpointer holds
  THIS thread's state only. Cross-thread facts live in a store (not a
  checkpointer), namespaced per user/org. Checkpoints are never bloated
  with long-term data, and cross-run facts are never read from
  checkpoints.
- **Sub-agents:** per-invocation persistence by default (each scout
  call starts fresh). Per-thread sub-agent memory is opt-in only, named
  in a future design, with namespace isolation (unique node names) so
  parallel sub-agents cannot overwrite each other's checkpoints.
- **Retention / pruning policy (the choice):** a periodic prune job
  deletes checkpoints older than 90 days, EXCEPT the latest checkpoint
  of each thread, which is kept regardless of age so a paused
  human-approval run can always resume. Rationale: 90 days bounds cost
  and latency growth; the latest-per-thread exception preserves
  resumability, which is the checkpointer's purpose. STATUS: this
  policy is RECORDED here as the design choice; the prune job itself is
  wiring-leg work and is NOT yet built — do not quote it as running.

## §6 — Retry bounds + verdict shape (core-discipline.md §6)

- **Verify retry bound:** `max_attempts = 3` (default), counted in
  state (`attempts`, not wall-clock hope), in both the pure-Python
  graph and the real LangGraph adapter (conditional edge:
  verify→verify while the verifier failed AND attempts remain, else
  verdict). Why 3: enough for a transient verification failure to clear
  (e.g. a supplier page re-check) without letting a contested candidate
  burn unbounded verification cost; it matches the builder's bound and
  both test suites prove exactly-3-attempts exhaustion.
- **Framework backstop:** `recursion_limit` — verified against the
  INSTALLED Python package (langgraph 0.2.45 in B1's venv):
  `DEFAULT_RECURSION_LIMIT = 25` super-steps. This is the Python
  package's own default, checked in the installed code — NOT quoted
  from the JavaScript SDK doc (the grounding note's §4 caveat stands
  for the JS page; the Python number above was verified independently
  and must be re-checked on any langgraph upgrade). The backstop
  catches a runaway policy; it is NOT the retry policy — the
  counter-in-state + conditional edge is.
- **"Retry until correct" is prohibited:** no design in this record
  retries without a bound.
- **Best-effort verdict shape (at the bound):** a full `Verdict` is
  always delivered, never nothing and never a hang, matching the
  research spec verdict schema exactly:
  - `product`, `decision` ("list" | "skip" — veto-first-then-count:
    the veto check runs first on the final signals at verdict time,
    and the 3-signal family count decides LIST-eligibility only
    among candidates that pass the veto; a vetoed candidate is
    never an agent LIST),
  - `agreeing_families` (the families that agreed),
  - `disagreeing_families` (all disagreeing families, critical and
    soft, so no disagreement is hidden from the human approver),
  - `vetoed_by` (every critical family whose disagreeing signal
    vetoed a LIST; empty when no veto applies — a verdict with a
    non-empty `vetoed_by` MUST have `decision: "skip"`),
  - `reasoning` (veto status first, then family count vs the 3
    required; "best-effort verdict: verification did not pass
    within the attempt budget" when exhausted; disagreeing families
    NAMED with signal name + evidence on any verdict — soft
    disagreements named on a LIST, vetoing critical families named
    on the veto-SKIP, since a vetoed candidate can never be an
    agent LIST under the adopted veto rule; confidence is
    informational, never a gate),
  - `confidence` (mean agreeing-signal strength, 0.0–1.0, informational),
  - `requires_human_approval: true` (always, including LIST),
  - `outcome_record_id` (id of the outcome record for this
    candidate, pre-created by the wiring leg — see the research
    spec's verdict contract).
  Plus, outside the verdict itself: what failed is recorded in
  `state.errors` (planner/scout/verifier exceptions), and the
  verification state is False (failed) — never silently True.

## What this record does NOT claim

No live run, no live tool call, no deployment, no proven restart
recovery: #126's done condition (checkpointed state proven across a
restart on the VPS) and #127's done condition (n8n triggers a run and
the agent completes an action through an n8n webhook tool) are NOT met
by this record or by the skeleton code it reviews. They need the wiring
leg + QA + fact-check, each by a different agent than the builder.
