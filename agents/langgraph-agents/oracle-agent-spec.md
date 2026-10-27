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

## Done when (from #123)

An Oracle conversation answers from live tools (not static text) and
remembers context across turns. (Live-tool proof is B1/QA's leg; this
spec + the shared graph shape in research_agent/ are this leg's output.)

## Wiring-leg requirement — approval-gate enforcement (B2-8)

The human-approval gate is a FIELD on the verdict
(`requires_human_approval: true`), not an enforcement. Enforcement is a
wiring-leg (B1) requirement: downstream code MUST check the field and
refuse any catalog/order/state-changing action until a human approves
that specific verdict. Until that check exists in wired code, the gate
holds only on paper — do not close #123 on this spec alone.
