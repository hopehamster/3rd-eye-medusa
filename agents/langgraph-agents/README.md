# B2 leg — agent spec + skeleton (3rd Eye Supply ONLY)

Issues: #122 (primary — research deep agent), #123 (Oracle), #124 (Dev),
#125 (Fulfilment exception), all under parent #121.

## What this is

- `research-deep-agent-spec.md` — full spec for #122.
- `oracle-agent-spec.md`, `dev-agent-spec.md`,
  `fulfilment-exception-agent-spec.md` — one-page specs for #123–#125.
- `research_agent/` — minimal Python graph skeleton for #122:
  `state.py` (Signal / Verdict / AgentState), `rules.py` (3-signal rule),
  `graph.py` (plan → scout → analyze → verify → verdict, bounded
  reflection/retry, best-effort verdict on exhaustion),
  `langgraph_adapter.py` (LangGraph seam — see below).
- `tests/` — stdlib unittest suite, mocked scouts only, no live services.

## Run the tests

```sh
python3 -m unittest discover -s tests -v
# Real-graph tests need LangGraph: run under B1's venv instead:
../b1-service/.venv/bin/python -m unittest discover -s tests -v
```

**122 tests, all passing** (verified 2026-10-31: `Ran 122 tests ... OK
(skipped=2)`). The count previously written here (41) was stale.

The stdlib run now resolves its spec paths correctly (they pointed at a
`team-work/b2-agent` layout that no longer exists, which made 9 tests error
out at `setUp` with `FileNotFoundError`). `test_fix_specs.py` skips the one
class whose
`spec-fold-summary.md` is not present in this repo.

The real-graph tests (failing verifier retries 3x then best-effort, passing
verifier, no-verifier unverified state, MemorySaver checkpointer, verdict
parity with the pure-Python rule) execute when LangGraph is installed. Mocked
scouts only, no live services.

## LangGraph status — stated plainly (fixed 2026-10-27, B2-1)

LangGraph IS installed in B1's venv (langgraph 0.2.45), and the adapter
now builds a REAL graph there with the same bounded-retry/best-effort
verify logic as `graph.py`, plus verifier, max_attempts, and
checkpointer arguments. On a stdlib-only interpreter without LangGraph,
`research_agent/langgraph_adapter.py` still reports
`HAS_LANGGRAPH = False` and `build_langgraph_graph()` raises a clear
RuntimeError instead of faking a graph.

## Wiring seam — B1 owns integration

B1's service leg owns checkpoint creation (pooled PostgresSaver +
`setup()` first-use step) and tool execution. This leg consumes them:
the adapter accepts a `checkpointer` argument and scouts wired to B1's
`execute_tool`. There is exactly one integration shape.

## Escalation-only router

Per the coordinator amendment to #122, the deep agent is
ESCALATION-ONLY: `research_agent/router.py` routes from the default
composite+judge path on quantified triggers (conflict, novelty, spend
>= $500, first-pass verification failure). See
`research-deep-agent-spec.md` for the trigger definitions; the $500
figure is an owner-set placeholder, tuned by the cost-based method
in that spec (escalation-cost vs. error-cost, retuned from overrides
and outcomes once outcome records exist) — not a Michael-approved
number and not a field-standard number.

## Boundary — what this leg deliberately does NOT do

No real LLM calls, no live tools, no service hosting — that is B1's leg.

Also out of scope for this leg: review, fact-check, merge, or deploy of
its own work (another agent reviews it); any push to main; any edit to
the repo checkout at `~/workspace/3rd-eye-supply/3rd-eye-medusa`.

## Secrets

Environment variables only, never in code or specs. Nothing in this
directory holds a credential.
