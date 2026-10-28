# Oracle agent — short spec (issue #123, child of #121)

## Job

Answer questions about the store from live tools, not static text, and
remember context across turns in a conversation.

## Graph

understand → tool calls → answer, with memory/state carried between turns.

- **understand**: parse the question; decide which tools are needed and
  what each needs (order id? product handle? tracking number?). If a
  needed identifier is missing, ask for it — never guess one.
- **tool calls**: catalog lookup (product, price, availability), order
  status (Medusa order state), CJ tracking (shipment status). Tools are
  n8n webhook endpoints (action layer); the agent only reasons and calls.
- **answer**: reply grounded in what the tools actually returned, citing
  the tool result. If a tool failed, say which one and what is unknown —
  never fill the gap with a plausible answer.

## Memory

Conversation state (prior turns, resolved identifiers, prior answers)
persists in Postgres checkpointing so a follow-up ("and when does it
arrive?") resolves against the order already discussed. Memory holds
identifiers the user supplied, never secrets or credentials.

## Rules

- Read-only tools only. The Oracle agent never refunds, cancels, reorders,
  or changes anything — it answers. Actions go to the fulfilment agent
  path with its own gates.
- No live data is cached as fact beyond the conversation; re-call tools
  on a new question rather than quoting a stale answer.
- Unknown = unknown: say so, name the missing piece, and ask.

## Framework — per-agent decision (adopted 2026-10-27, #128 comment
6447161191)

This agent uses `create_agent` (the minimal LangChain agent harness)
with `interrupt_on` for money actions. This is a per-agent decision,
not a blanket harness blessing: the research agent (#122) stays on
its small custom graph, and the dev agent (#124) is spec-only with
no trial process (Michael 2026-10-27, comment 6460788465). See
`core-discipline.md` for the per-agent framework table.

`interrupt_on` here is a defensive gate, stated plainly so it is not
over-read: this agent is read-only and HAS no money tools, so there
is currently nothing for `interrupt_on` to pause. The requirement
is forward-looking and binding: if a money-capable tool is ever
added to this agent, it MUST be listed in `interrupt_on` before
first use, so execution pauses for a human approve/edit/reject
decision before the action runs. `interrupt_on` never authorizes a
money action on its own, and it never weakens the read-only rule
below — adding a money tool would be a separately approved scope
change, not a framework detail.

## Done when (from #123)

An Oracle conversation answers from live tools (not static text) and
remembers context across turns. (Live-tool proof is B1/QA's leg; this
spec + the shared graph shape in research_agent/ are this leg's output.)

## Wiring-leg requirement — approval-gate enforcement (B2-8)

The Oracle agent produces answers, not verdicts, so it has no verdict
field for a gate to check — the research agent's verdict language
does not apply here. The #123 check shape is: downstream code MUST
refuse any state-changing action arising from an Oracle answer
(catalog, order, or customer-record write) until a human approves
that specific action. Enforcement is a wiring-leg (B1) requirement:
the check lives in wired code, not in this spec sentence. Today the
agent is read-only, so the check binds any future action surface
before its first use. Until that check exists in wired code, the
gate holds only on paper — do not close #123 on this spec alone.
