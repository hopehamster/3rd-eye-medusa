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
| LIST verdict → any catalog write | HUMAN APPROVAL. The verdict is a recommendation only; `requires_human_approval: true` on every verdict, and wired downstream code MUST check it before any catalog/order write. | Verdict field (B2) + wiring-leg check (B1) — the check itself is a wiring-leg requirement, recorded on #123/#124 specs (B2-8). Until that check exists in wired code, the gate holds on paper only. |
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
  always delivered, never nothing and never a hang:
  - `product`, `decision` ("list" | "skip" — family-count rule only),
  - `agreeing_families` (the families that agreed),
  - `reasoning` (family count vs the 3 required; "best-effort verdict:
    verification did not pass within the attempt budget" when exhausted;
    disagreeing families NAMED with signal name + evidence on any LIST;
    confidence is informational, never a gate),
  - `confidence` (mean agreeing-signal strength, 0.0–1.0, informational),
  - `requires_human_approval: true` (always, including LIST).
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
