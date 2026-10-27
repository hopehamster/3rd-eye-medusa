# Library grounding note — LangGraph patterns in the first agent (B3, issue #129)

## Read this first: what this note is and is not

This note maps each pattern the first agent (B2's research deep agent) uses to
(a) a course module title and (b) an official LangGraph/LangChain doc page.
It is grounded in **module titles + official docs, not in watched lecture
content**. I cannot access Michael's Mac library directly, and I have not
watched or read any lecture transcript for these courses.

Labels used throughout:

- **VERIFIED (doc)** — I fetched the official doc page text on 2026-10-27
  and the section named says what this note claims it says.
- **INFERRED (course)** — the link from pattern to course module is inferred
  from the module *title* only. It means "this module's topic plausibly
  covers this pattern." It does NOT mean the lecture teaches this pattern,
  and it does NOT mean B2 learned the pattern from that course.
- **GAP** — no matching module title, or no dedicated doc section, was
  found. The pattern is then a design choice of B2's, not a documented
  course/doc feature, and the note says so.

## One company, one ecosystem

Per Michael's correction (2026-10-26): LangChain and LangGraph are the SAME
company (LangChain Inc.), same ecosystem — not two separate things. The
LangGraph material lives INSIDE the LangChain courses. This note therefore
never treats "LangChain" and "LangGraph" as competing provenances. The
courses cited are:

- Pluralsight, "Memory, State, and Conversational Applications in LangChain"
  — modules: memory fundamentals; memory types/strategies; token cliff /
  costs / governance; multi-turn applications; risks / governance /
  observability.
- Packt, "Building AI Agents with Python and LangChain" — chapters: weather
  agent; real-world agent; agents with memory; persistent DB memory; agent
  web app; web search agents.
- Packt, "Agentic AI Systems" — named in issue #129 as "also check"; no
  chapter list was supplied in the brief, so no tie in this note claims a
  chapter from it. That is a GAP, not an omission to fill by guessing.

## 1. State carried between nodes

What it is in B2's agent: nodes read and write one shared state object
instead of passing values through ad-hoc function arguments, so later nodes
see what earlier nodes found.

- Course tie — **INFERRED (course)**: Pluralsight "memory fundamentals"
  and "multi-turn applications" (state is what carries context across
  turns); Packt "agents with memory" (an agent that remembers across steps
  needs state somewhere). Neither title names LangGraph state channels.
- Official doc — **VERIFIED (doc)**:
  https://docs.langchain.com/oss/python/langgraph/persistence — section
  "Checkpointer vs. store": a checkpointer persists "graph state snapshots"
  for "a single thread"; a store persists "application-defined key-value
  data" "across threads". And
  https://docs.langchain.com/oss/python/concepts/memory — section
  "Short-term memory": "LangGraph manages short-term memory as a part of
  your agent's state. State is persisted to a database using a checkpointer
  so the thread can be resumed at any time."
- What this does NOT prove: that any course lecture teaches the state
  schema B2 chose. The doc proves the mechanism exists; the schema design
  is B2's.

## 2. Planning before tool calls

What it is in B2's agent: the agent writes an explicit plan (what to look
for, in what order) into state before any tool runs, and tools execute
against that plan rather than free-running.

- Course tie — **INFERRED (course), weak**: Packt "real-world agent" is
  the nearest title — a real agent decides before it acts — but no supplied
  module title names planning, plan-then-act, or a planning node. Do not
  upgrade this to a strong tie.
- Official doc — **GAP**: no dedicated official doc page for "planning
  before tool calls" was verified. The agent loop itself (model node,
  conditional edge to a tools node, loop back) is standard LangGraph
  structure, but planning-as-a-separate-step is B2's design choice layered
  on top of it, not a named framework feature this note could cite. The
  closest verified machinery is the conditional-edge routing the loop
  uses, and the interrupt machinery in §6 below for gating execution.
- Honest statement: this pattern is grounded in B2's design, not in a
  course module or a doc section. Anyone claiming otherwise is dressing
  up a title match.

## 3. Sub-agent fan-out

What it is in B2's agent: one parent task fans out to parallel sub-agents
(each researching a slice), then a downstream node synthesises their
results.

- Course tie — **INFERRED (course)**: Packt "web search agents" (parallel
  searching is the natural fan-out example) and "real-world agent" (a real
  agent delegates). No supplied title names fan-out, sub-agents, or
  map-reduce. Both ties are weak.
- Official doc — **VERIFIED (doc)**:
  https://docs.langchain.com/oss/python/langgraph/use-subgraphs — section
  "Define subgraph communication": a subgraph is "a graph that is used as
  a node in another graph"; subgraphs are useful for "building multi-agent
  systems" and "reusing a set of nodes in multiple graphs". Same page,
  section "Subgraph persistence": per-invocation (default, each call starts
  fresh), per-thread (`checkpointer=True`, state accumulates across calls
  on the same thread), stateless (`checkpointer=False`, no interrupts or
  durable execution). For fan-out, per-invocation is the default that
  matches independent one-off sub-agents; per-thread is only for a
  sub-agent that must remember across calls.
- Official doc — **VERIFIED (doc)**, reducers section, cited explicitly
  (fix pass, B3-3):
  https://docs.langchain.com/oss/python/langgraph/use-graph-api —
  section "Process state updates with reducers": "Each key in the state
  can have its own independent reducer function, which controls how
  updates from nodes are applied. If no reducer function is explicitly
  specified then it is assumed that all updates to the key should
  override it." For `TypedDict` state schemas, reducers are attached by
  annotating the field with a reducer function; the built-in
  `add_messages` reducer is the append example. Fetched 2026-10-27.
- Design consequence the doc forces: parallel branches writing the same
  state key need a reducer/merge rule, and fan-out results should land in
  an append-only collection the synthesis node reads — otherwise branches
  overwrite each other. B2's fixed design avoids the multi-writer
  problem by construction: a SINGLE scout node fans out internally
  (ThreadPoolExecutor) and returns the full signal list once, so no two
  nodes ever write the same state key; the synthesis (verdict) node
  reads that append-only collection. The reducer rule itself is doc-backed
  (above); the single-writer scout-node shape is B2's design choice.

## 4. Bounded reflection / retry

What it is in B2's agent: when a result fails a check, the agent reflects
and retries — but only up to a fixed count, after which it stops retrying
and delivers a verdict on what it has.

- Course tie — **INFERRED (course)**: Pluralsight "risks / governance /
  observability" (an unbounded loop is a cost and reliability risk, which
  is exactly what a bound governs). No supplied title names reflection,
  retry, or loop limits. Weak tie; the bound itself is a discipline
  choice, not course content claimed here.
- Official doc — **VERIFIED (doc), with a version caveat**:
  https://docs.langchain.com/oss/javascript/langgraph/graph-api — section
  "Recursion limit": "The recursion limit sets the maximum number of
  super-steps the graph can execute during a single execution. Once the
  limit is reached, LangGraph will raise `GraphRecursionError`." That page
  is the JavaScript SDK doc and states a default of 25 super-steps; the
  Python default was NOT verified in this pass and must not be quoted
  from the JS page. Treat `recursion_limit` as a backstop, not as the
  retry policy: B2's own counter-in-state + conditional edge to a verdict
  node is the policy; the framework limit is what catches the policy
  failing.
- What this does NOT prove: any course teaches reflection. "Reflection"
  as a named technique appears in the LangChain memory overview only as
  prompt self-refinement (see §5), not as a retry loop. The retry bound
  is ours (see `core-discipline.md`).

## 5. Persistent memory / checkpointing

What it is in B2's agent: work survives interruption — a run can pause,
crash, or wait, and resume from its last checkpoint; durable facts persist
across runs.

- Course tie — **INFERRED (course)**: Pluralsight "memory types /
  strategies" and "token cliff / costs / governance" (what to persist vs.
  what to re-derive is a cost decision); Packt "persistent DB memory"
  (the most direct title match in either course — persistence backed by a
  database). "Persistent DB memory" is the strongest course tie in this
  whole note, and it is still INFERRED: the title says the chapter is
  about DB-backed memory, not that it teaches LangGraph checkpointers.
- Official doc — **VERIFIED (doc)**:
  https://docs.langchain.com/oss/python/langgraph/persistence — whole page,
  especially "Checkpointer vs. store" (above) and "Troubleshooting common
  issues": "`MemorySaver` and `InMemorySaver` store checkpoints in RAM.
  When the process restarts, all checkpoints are lost" — use a persistent
  checkpointer (PostgresSaver / SqliteSaver) in production; and
  "Checkpoints growing unboundedly" — "Prune old checkpoints periodically
  or set a retention policy." And
  https://docs.langchain.com/oss/python/concepts/memory — sections
  "Short-term memory" (thread-scoped, via checkpointer) and "Long-term
  memory" (cross-thread, via stores with custom namespaces).
- Design consequence: short-term (this run's state) and long-term (facts
  across runs) are two different mechanisms in the docs — checkpointer vs.
  store. An agent that conflates them will either lose facts on restart
  (in-memory checkpointer) or bloat checkpoints with long-term data.
  Keep them separate.

## 6. Human-approval gate

What it is in B2's agent: before a consequential action (spending money,
publishing, writing externally), execution pauses and a human approves,
edits, or rejects — it never proceeds autonomously.

- Course tie — **INFERRED (course)**: Pluralsight "risks / governance /
  observability" (approval gates are a governance control). No supplied
  title names human-in-the-loop, approval, or interrupts. Weak tie.
- Official doc — **VERIFIED (doc)**:
  https://docs.langchain.com/oss/python/langgraph/interrupts — sections
  "Pause using `interrupt`" ("LangGraph saves the current graph state
  and waits for you to resume execution with input"; needs a checkpointer
  + thread ID + JSON-serializable payload), "Resuming interrupts"
  (resume with `Command(resume=...)` on the same thread ID; "the node
  restarts from the beginning of the node where `interrupt()` was
  called"), "Common patterns" ("Approval workflows: Pause before
  executing critical actions (API calls, database changes, financial
  transactions)"), and "Rules of interrupts" ("Side effects called
  before `interrupt` must be idempotent" — because the node re-runs on
  resume, a non-idempotent side effect before the gate executes twice).
  Also https://docs.langchain.com/oss/python/langchain/human-in-the-loop
  — the HITL middleware: a decision of approve / edit / reject / respond
  per tool call, built on the same interrupt + persistence layer.
- Design consequence the doc forces, and the one most often missed:
  put the side effect AFTER the interrupt, never before it. A money or
  publish call placed before the approval node runs, then runs again on
  resume. The gate must precede the effect, and the effect must be
  idempotent anyway.

## INFERRED ties — full list (all course ties in this note are INFERRED)

1. State carried between nodes → Pluralsight "memory fundamentals",
   "multi-turn applications"; Packt "agents with memory".
2. Planning before tool calls → Packt "real-world agent" (weak; no title
   names planning).
3. Sub-agent fan-out → Packt "web search agents", "real-world agent"
   (weak; no title names fan-out).
4. Bounded reflection / retry → Pluralsight "risks / governance /
   observability" (weak; no title names reflection or retry).
5. Persistent memory / checkpointing → Pluralsight "memory types /
   strategies", "token cliff / costs / governance"; Packt "persistent DB
   memory" (strongest title match, still INFERRED).
6. Human-approval gate → Pluralsight "risks / governance / observability"
   (weak; no title names HITL or approval).

No course tie in this note is VERIFIED. None should be quoted as
"the course teaches X" without the upgrade below.

## What I could NOT verify, and what would unblock it

1. **Any lecture content.** I worked from the module/chapter lists in
   issue #129 and the brief, plus official docs. Unblock: someone with
   access to the Mac library checks lecture transcripts, subtitles, or
   chapter text for each INFERRED tie and confirms or rejects it; then
   this note's INFERRED tags get upgraded to VERIFIED (with a timestamp
   and source) or deleted.
2. **Packt "Agentic AI Systems" chapters.** No chapter list was supplied.
   Unblock: supply the chapter list; do not guess it.
3. **Whether B2 learned any pattern from any course.** That is a claim
   about B2's process, not about the courses. Unblock: B2's own record
   (its brief, its citations). Until then, this note maps concepts; it
   does not attribute learning.
4. **Python `recursion_limit` default.** Only the JS SDK doc default (25)
   was verified. Unblock: check the installed Python `langgraph`
   package's documented default before quoting a number in code or a
   design review.
5. **A dedicated official doc page for planning-before-tools.** None
   verified. Unblock: none needed — treat planning as B2's design
   choice, judged on its merits in design review, not as doc-backed.

## Boundary

Boundary: this note maps concepts to docs and course titles; it does not
prove lecture content or that B2 learned any pattern from any course.
