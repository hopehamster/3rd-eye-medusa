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
