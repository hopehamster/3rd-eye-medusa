"""Graph skeleton: plan -> scout -> analyze -> verify -> verdict.

Node/edge/state shape mirrors a LangGraph StateGraph (see
langgraph_adapter.py for the real-graph seam, which implements the SAME
verify retry / best-effort logic — B2-1). This module runs the same
nodes in order with plain Python so the skeleton is testable with zero
dependencies and zero live services.

Reflection/retry: the verify node retries up to ``max_attempts`` times.
On exhaustion it does NOT hang and does NOT fail empty-handed: it falls
through to a best-effort verdict, exactly like the deliver-best-attempt
rule used elsewhere on this project.

Always-a-verdict (B2-5): planner, scout, and verifier exceptions are
recorded in state.errors and the run STILL produces a verdict. The only
thing an exception changes is the record of what failed — never whether
an answer exists. verifier=None leaves state.verified as None
("no verifier wired"), which is distinct from False ("verifier ran and
failed") and must never be reported as verified.

Fan-out (B2-7): scouts run in parallel where the runtime allows — a
ThreadPoolExecutor over the scout callables, gathered in submission
order so signal order is deterministic. Scouts must be thread-safe;
pass parallel=False for a sequential run. Scout dict keys are validated
against SIGNAL_FAMILIES, signals whose family does not match their
scout key are QUARANTINED (dropped + recorded), and families with no
scout are recorded in state.missing_families (callers may pass a
subset; the gap is named, not hidden).
"""

from collections.abc import Callable, Mapping
from concurrent.futures import ThreadPoolExecutor

from research_agent.rules import count_agreeing_families, decide_verdict
from research_agent.state import SIGNAL_FAMILIES, AgentState, Signal

NODES: list[str] = ["plan", "scout", "analyze", "verify", "verdict"]

Planner = Callable[[str], list[str]]
Scout = Callable[[str], list[Signal]]
Verifier = Callable[[AgentState], bool]


def default_planner(product: str) -> list[str]:
    """Write an explicit plan before any tool/scout call."""
    return [
        f"Research candidate: {product}",
        "scout: fan out one sub-agent per signal family",
        "analyze: count independent agreeing families (3-signal rule)",
        "verify: re-check the strongest claims; retry on failure",
        "verdict: list-or-skip with reasoning, gated on human approval",
    ]


def _run_one_scout(family: str, scout: Scout, product: str) -> tuple[list[Signal], list[str]]:
    """Run one scout, quarantining wrong-family signals (B2-7).

    Returns (accepted signals, error strings). Scout exceptions are the
    caller's problem to record — this helper raises them so run_research
    records them in one place.
    """
    accepted: list[Signal] = []
    errors: list[str] = []
    for signal in scout(product):
        if signal.family != family:
            errors.append(
                f"scout {family!r} returned a {signal.family!r} signal; "
                "quarantined (family must match the scout key)"
            )
            continue
        accepted.append(signal)
    return accepted, errors


def run_research(
    product: str,
    scouts: Mapping[str, Scout],
    *,
    planner: Planner | None = None,
    verifier: Verifier | None = None,
    max_attempts: int = 3,
    parallel: bool = True,
) -> AgentState:
    """Run one research pass over a candidate product.

    Args:
        product: Candidate product name/description (free text).
        scouts: One injected callable per signal family. In tests these
            are mocks; in production wiring they call n8n tool endpoints
            via B1's execute_tool. Keys MUST be known signal families.
        planner: Optional planning callable. Defaults to default_planner.
        verifier: Optional verification callable returning True when the
            analysis checks out. None means "no verifier wired" — the
            state records verified=None, never True.
        max_attempts: Bound on verify retries; then best-effort verdict.
        parallel: Fan scouts out concurrently when True (default) and
            more than one scout is present; False runs them in order.

    Returns:
        The final AgentState, always carrying a verdict.
    """
    unknown_keys = sorted(set(scouts) - set(SIGNAL_FAMILIES))
    if unknown_keys:
        raise ValueError(f"unknown scout families: {', '.join(unknown_keys)}")
    state = AgentState(product=product, max_attempts=max_attempts)
    state.missing_families = [f for f in SIGNAL_FAMILIES if f not in scouts]

    # Node: plan. This MUST run before any scout call.
    plan_fn = planner or default_planner
    try:
        state.plan = plan_fn(product)
    except Exception as exc:  # noqa: BLE001 - recorded, verdict still produced
        state.errors.append(f"planner failed: {type(exc).__name__}: {exc}")
        state.plan = []

    # Node: scout. Fan-out: every family scout runs, results accumulate.
    def run_scout(item: tuple[str, Scout]) -> tuple[list[Signal], list[str]]:
        family, scout = item
        try:
            return _run_one_scout(family, scout, product)
        except Exception as exc:  # noqa: BLE001 - recorded, verdict still produced
            return [], [f"scout {family!r} failed: {type(exc).__name__}: {exc}"]

    items = list(scouts.items())
    if parallel and len(items) > 1:
        with ThreadPoolExecutor(max_workers=len(items)) as pool:
            results = list(pool.map(run_scout, items))
    else:
        results = [run_scout(item) for item in items]
    for signals, errors in results:
        state.signals.extend(signals)
        state.errors.extend(errors)

    # Node: analyze. Summarize what the signals say under the 3-signal rule.
    agreeing = count_agreeing_families(state.signals)
    state.analysis = (
        f"{agreeing} independent families agree "
        f"out of {len(state.signals)} signals gathered."
    )
    if state.missing_families:
        state.analysis += (
            " Missing families (not scouted): "
            f"{', '.join(state.missing_families)}."
        )

    # Node: verify, with a bounded reflection/retry loop.
    best_effort = False
    if verifier is None:
        state.verified = None  # B2-5: unwired is not verified
    else:
        for _ in range(max_attempts):
            state.attempts += 1
            try:
                passed = verifier(state)
            except Exception as exc:  # noqa: BLE001 - a failing verifier is a failed attempt
                state.errors.append(
                    f"verifier failed: {type(exc).__name__}: {exc}"
                )
                passed = False
            if passed:
                state.verified = True
                break
        else:
            state.verified = False
            best_effort = True  # budget exhausted: deliver, never hang

    # Node: verdict. Always produced, even on the best-effort path.
    state.verdict = decide_verdict(
        state.signals, product, best_effort=best_effort
    )
    return state
