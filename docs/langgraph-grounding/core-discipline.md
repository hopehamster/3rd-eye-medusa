# Core discipline — LangGraph in 3rd Eye Supply (B3, issue #128)

Standing discipline for every agent built with LangGraph. Cited in the
first agent's design review (that citation is issue #128's done condition).
This is a discipline doc, not a tutorial: it states the rules and the
question every design review must answer. It does not claim anything is
live, deployed, or proven — it governs work before it ships.

## The discipline, in one paragraph

LangGraph augments n8n; it never replaces it. Use LangGraph core plus
direct LLM calls, not heavy abstraction. Every new agent must answer, in
its design review: **"Does the graph earn its complexity over an n8n
workflow?"** Money actions are human-approved or rule-gated, never
autonomous. Long runs checkpoint. Retries are bounded, then the agent
delivers a best-effort verdict — it never hangs.

## 1. LangGraph augments n8n, never replaces it

- n8n remains the automation backbone: scheduling, webhooks, distribution,
  polling, approvals routing, and anything that is a workflow between
  systems. A graph does not re-implement a workflow n8n already runs.
- LangGraph earns its place only inside a step where the work itself is
  agentic: branching reasoning, tool choice, reflection, or multi-agent
  fan-out that cannot be expressed as a fixed sequence of nodes.
- If the flow is a fixed sequence with no branching on model judgement,
  it belongs in n8n, not in a graph. "We built it in LangGraph" is not a
  reason; the design review question in §3 is the test.
- LangChain and LangGraph are the same company (LangChain Inc.), same
  ecosystem (Michael's correction, 2026-10-26). Do not frame a choice
  between them as a vendor choice. The choice that matters is graph vs.
  n8n workflow vs. plain code — and the graph must justify itself
  against both, not just against n8n.

## 2. LangGraph core + direct LLM calls over heavy abstraction

- Prefer: `StateGraph`, explicit state schemas, explicit nodes and edges,
  direct model calls inside nodes, and the documented primitives
  (checkpointer, store, `interrupt()`).
- Avoid by default: prebuilt agent frameworks, middleware stacks, and
  abstraction layers that hide the loop, the state, or the routing. If a
  layer hides what the agent decided and why, debugging pays for it later.
- Every abstraction added beyond core must name, in the design review,
  the concrete problem it solves that core does not — "cleaner" is not a
  problem.
- Keep the graph readable as a diagram: a reviewer who cannot trace
  START → nodes → conditional edges → END from the code has found a
  design defect, not a documentation gap.

## 3. The design-review question (mandatory, every new agent)

**"Does the graph earn its complexity over an n8n workflow?"**

The review records a written answer, not a nod. The answer must name:

1. What branches on model judgement (not on fixed rules) — if nothing
   does, the graph fails the question.
2. What state must survive across steps, pauses, or crashes that an n8n
   execution does not already carry.
3. What the graph costs that the n8n workflow would not: more code, a
   checkpointer to operate, checkpoint growth to prune, and a second
   runtime to observe.
4. The n8n-only alternative that was considered and why it was rejected
   — in one paragraph, with the specific step it cannot express.

A graph that cannot answer all four does not proceed. "The course used a
graph" is not an answer. Neither is "agents need graphs."

## 4. Money actions: human-approved or rule-gated, never autonomous

- Any action that spends money, moves money, publishes externally, writes
  to a customer record, or deletes data is consequential. Consequential
  actions never run on model judgement alone.
- Two allowed gates, and the design must pick one per action and say so:
  - **Human approval:** execution pauses at an `interrupt()` before the
    action; a human approves, edits, or rejects; the action runs only on
    approval. The side effect goes AFTER the interrupt, never before it
    — on resume the node re-runs from its start, so a pre-gate side
    effect executes twice. The effect itself must still be idempotent.
  - **Rule gate:** a deterministic, code-checked rule (amount cap, allow
    list, exact-match condition) that the model cannot override. The rule
    lives in code, not in the prompt. A prompt instruction ("only spend
    under $X") is not a rule gate.
- No third option. "The model is usually careful" is not a gate.
- Approval payloads are JSON-serializable and human-readable: what is
  about to happen, for how much, to whom/what, and what approval changes.
  A payload a human cannot judge is a failed gate, however correct the
  plumbing is.

## 5. Checkpoints for long runs

- Any run that can pause, wait on a human, run long enough to crash, or
  be resumed later compiles with a durable checkpointer — not an
  in-memory one. In-memory checkpointers lose everything on restart;
  that is a development convenience, not a production choice.
- Short-term and long-term memory stay separate: the checkpointer holds
  this thread's state; the store holds facts across threads (namespaced
  per user/org). Do not bloat checkpoints with long-term data, and do
  not rely on checkpoints for cross-run facts.
- Set a checkpoint retention/pruning policy before shipping a long-lived
  agent. Unbounded checkpoint growth is a cost and latency incident
  with a slow fuse, not a surprise.
- Sub-agents default to per-invocation persistence (each call starts
  fresh). Per-thread sub-agent memory is opt-in, named in the design,
  with namespace isolation (unique node names) so parallel sub-agents
  cannot overwrite each other's checkpoints.

## 6. Bounded retries, then best-effort verdict — never a hang

- Every loop and every retry has an explicit bound, counted in state
  (attempts, not wall-clock hope): a maximum retry count and a maximum
  super-step / recursion budget as a framework backstop.
- On reaching the bound, the agent delivers a best-effort verdict on
  what it has: partial results, what failed, and what would unblock a
  better result. It never fails with nothing, and it never loops forever.
- The bound is a design value, recorded in the review: how many retries,
  why that number, and what the verdict contains at the bound. "Retry
  until correct" is prohibited as a design — it has no bound, and an
  unbounded loop is a cost incident, not persistence.
- Do not quote a framework recursion default from the wrong SDK. The
  JavaScript doc default and the Python default are not interchangeable;
  check the installed package's documented default before writing a
  number into code or a review.

## 7. What "done" means for this discipline

This discipline is cited — not merely written — in the first agent's
design review. That means the review record contains: the §3 question
with its four-part written answer, the per-action money gates from §4,
the checkpointer and retention choice from §5, and the retry bounds plus
best-effort verdict shape from §6. A review that cites this file's title
without those four records has not satisfied issue #128.

## 8. Per-agent framework — no blanket harness blessing (adopted
2026-10-27, #128 comment 6447161191)

Section 2's "avoid prebuilt frameworks by default" still stands.
What the 2026-10-27 decision adds is a per-agent ruling, not a
blanket amendment to §2. Each agent's framework must be named in
its own spec and in its design review; an agent whose spec does not
name its framework has not satisfied this discipline.

| Agent | Framework | Why this one |
|---|---|---|
| Research deep agent (#122) | Small custom graph (LangGraph core + direct LLM calls, as built) | A single list/skip judgement with deterministic gates (veto, 3-signal count) + human approval. The field fit for this shape; the full deepagents harness is not adopted here. |
| Oracle (#123) | `create_agent` + `interrupt_on` for money actions | Short, focused, read-only answering. `interrupt_on` is a defensive gate: no money tools exist today, and any money tool added later must be interrupt-gated before first use. |
| Dev (#124) | Spec only — no trial | Dev-trial judging DROPPED (Michael 2026-10-27, comment 6460788465): no trial process is imposed, pursued, or left as an open item. #124 stays spec-only; its graph shape (plan → tools → reflect → verdict, with a critic loop) is recorded in the dev spec without any trial, judging process, owner, duration, or evidence pack. |
| Fulfilment exception (#125) | `create_agent` + `interrupt_on` for money actions | Short recommendation judgement over ambiguous failure evidence. `interrupt_on` is the enforcement backstop behind recommend-only; it does not authorize execution. |

Free-only, LangChain-wise (standing): only free LangChain offerings
are in scope — skills repo, LangSmith Developer free tracing,
LangSmith Studio, Academy, open-source frameworks. Paid offerings
are out. n8n stays the action layer for every agent above; no
framework choice moves scheduling, distribution, or action
execution off n8n.

## 9. Learning — propose-only, behind eval gates (adopted 2026-10-27)

Learned changes (signal reweights, threshold changes, rule
refinements, prompt/model changes that encode learned behaviour)
are PROPOSE-ONLY to a human. No silent auto-apply. The only
auto-apply zone contemplated by field practice is narrow,
reversible, low-blast parameters behind an eval gate with automatic
rollback — and that zone is NOT adopted in this phase: until the
outcome record exists and an eval set is built from it, proposals
wait, and no auto-apply of reweights is authorized at all.

When a human-approved proposal is promoted, it goes through eval
gates in order, and a failure at any gate stops promotion:

1. **Evals:** offline golden set + safety set + regression
   comparison against current production; block on any critical
   score drop.
2. **Shadow:** candidate runs silently, output not served.
3. **Small canary:** a small external slice.
4. **Staged ramp:** staged increases toward full rollout.
5. **Instant rollback:** repoint a label/tag, not a redeploy;
   prompt/model versions logged per request so a rollback target
   is known before it is needed.

No learning claim may be made before the outcome record
(`outcome-record-spec.md`) exists for the candidates claimed about,
with verdict, human decision, and real outcome recorded separately
and confounders alongside. A before/after story without a
comparison cohort is not a learning claim.

## 10. Pins — HOLD through the #130/#131 merge decision (adopted
2026-10-27)

Hold langgraph 0.2.45 through the #130/#131 merge decision. No
silent drift, no upgrade inside a feature trial or a spec fold.
After the merge decision, upgrades go on a SEPARATE upgrade-pins
branch with a full suite re-run, and the recursion-limit / default
values recorded in design reviews are re-checked against the
installed package before any number is quoted from them again.

## Boundary

Boundary: this doc sets the rules a design review must enforce; it does
not prove any agent satisfies them — only that agent's review record does.
