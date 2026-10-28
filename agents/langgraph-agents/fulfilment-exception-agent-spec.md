# Fulfilment exception agent — short spec (issue #125, child of #121)

## Job

Investigate failed and dead-letter orders from the fulfilment pipe and
recommend exactly one of: retry, refund, or alert — with reasoning.

## Graph

triage → investigate → recommend, with evidence at each step.

- **triage**: pick up the dead-letter/failed order; classify the failure
  (supplier? payment? tracking? address? system?).
- **investigate**: call the relevant tools (order status, CJ tracking,
  supplier state) via n8n webhook endpoints; gather what changed since
  the failure and whether the blocking condition still holds.
- **recommend**: retry / refund / alert, with reasoning and the evidence
  behind it, plus what a human should check first.

## HARD RULE — money actions: RECOMMEND-ONLY in this phase

Money actions (refunds, re-charges, re-orders that spend money) are
**human-executed, never autonomous**. This agent RECOMMENDS ONLY: it
recommends retry, refund, or alert with reasoning and evidence, and a
human executes whatever money action follows. It never executes a
refund or a paid retry on its own, under any rule.

Rule-gated execution (a written, human-approved rule that code checks
before acting) is a LATER, SEPARATELY APPROVED scope — it is not part
of this build, and no sentence in this spec authorizes it. Anything the
agent cannot recommend confidently goes to a human as an alert. No
exceptions, no "the agent judged it safe" override.

## Framework — per-agent decision (adopted 2026-10-27, #128 comment
6447161191)

This agent uses `create_agent` (the minimal LangChain agent harness)
with `interrupt_on` for money actions. This is a per-agent decision,
not a blanket harness blessing: the research agent (#122) stays on
its small custom graph, and the dev agent (#124) is spec-only with
no trial process (Michael 2026-10-27, comment 6460788465). See
`core-discipline.md` for the per-agent framework table.

How `interrupt_on` composes with the recommend-only rule below,
stated explicitly so the two are not read as contradicting each
other: in this phase the agent RECOMMENDS and never executes a
money action, so `interrupt_on` is the enforcement backstop, not a
permission. Any money-capable tool wired to this agent MUST be
listed in `interrupt_on`, so that if execution is ever attempted
through the agent path it pauses for a human approve/edit/reject
decision before running. That backstop does NOT authorize execution:
rule-gated execution remains a later, separately approved scope,
and until it is approved the human executes every money action
outside the agent. `interrupt_on` without that approval is a guard
on a door that stays shut, not an opening of it.

## Loser decisions — not this agent's job (cross-reference)

This agent investigates single failed orders; it does not own
product lifecycle. It never auto-pauses an ad set and never delists
a listing. If a pattern of failed orders suggests a product is a
loser, the agent ALERTS with the evidence and points at the loser
rules in `research-deep-agent-spec.md` (ad sets: rule-gated
auto-pause with guards; listings: recommend-only + human gate,
never auto-delist). The loser decision itself belongs to that
lifecycle spec and its human gate, not to an order-level
recommendation.

## Rules

- One order, one recommendation, one reasoning trail. Batch summaries
  never hide an individual order's evidence.
- Never invent an order id, tracking number, or supplier reply.
- Alert is always a valid outcome: when evidence is thin, alert beats a
  confident wrong recommendation.

## Done when (from #125)

A dead-letter order produces an investigated recommendation
(retry/refund/alert) with reasoning. (Live-order proof is a later leg;
this spec is this leg.)
