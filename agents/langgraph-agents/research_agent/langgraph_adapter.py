"""LangGraph seam: the same node/edge/state shape as a real StateGraph.

STATUS (fixed 2026-10-27, B2-1): this module builds a REAL LangGraph
StateGraph when LangGraph is installed — which it is in B1's venv
(langgraph 0.2.45). The verify node + conditional edge implement the
SAME bounded-retry / best-effort logic as graph.py: retry while attempts
remain, else verdict with best_effort=True. It does NOT unconditionally
set verified=True, and it accepts the verifier, max_attempts, and
checkpointer the old version lacked. On a stdlib-only interpreter
without LangGraph it still reports HAS_LANGGRAPH=False and raises a
clear RuntimeError instead of faking a graph.

WIRING-SEAM OWNER: B1 owns checkpoint creation and tool execution. This
adapter CONSUMES them: pass a checkpointer built by B1's checkpoint
module (after its setup_postgres_saver first-use step), and wire scouts
to B1's execute_tool. This adapter defines no second checkpoint or tool
shape.

State shape: a plain dict (checkpoint-serializable). Signals travel as
plain dicts between nodes (converted to Signal objects only inside the
analyze/verdict nodes, where the rules functions need them); the final
verdict is a Verdict object, as in graph.py. verified is bool | None:
None means no verifier wired (B2-5), never "verified".
"""

from collections.abc import Callable, Mapping
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict

try:  # pragma: no cover - depends on the install environment
    from langgraph.graph import END, StateGraph  # type: ignore[import-not-found]

    HAS_LANGGRAPH = True
except ImportError:  # pragma: no cover - stdlib-only environment
    HAS_LANGGRAPH = False
    StateGraph = None  # type: ignore[assignment]
    END = None  # type: ignore[assignment]

from research_agent.graph import Scout  # noqa: E402
from research_agent.state import SIGNAL_FAMILIES  # noqa: E402

GraphState = dict
AdapterVerifier = Callable[[GraphState], bool]


def _signals_from_dicts(dicts: list[dict]) -> list:
    from research_agent.state import Signal

    return [Signal(**d) for d in dicts]


def build_langgraph_graph(
    scouts: Mapping[str, Scout],
    *,
    verifier: AdapterVerifier | None = None,
    max_attempts: int = 3,
    checkpointer: object | None = None,
) -> object:
    """Build a real LangGraph StateGraph, or fail loudly if unavailable.

    Node order: plan -> scout -> analyze -> verify -> verdict, with a
    CONDITIONAL edge on verify: back to verify while attempts remain,
    else verdict (best-effort when the budget is exhausted). Scouts are
    injected callables, so the graph shape does not depend on any live
    tool at build time. checkpointer, when given, is passed to compile()
    — it must come from B1's checkpoint leg, already set up.
    """
    if not HAS_LANGGRAPH or StateGraph is None:
        raise RuntimeError(
            "langgraph is not installed in this environment; "
            "install it (pip install langgraph) and rebuild. "
            "The pure-Python run_research() in graph.py mirrors these "
            "nodes until then — no graph is faked."
        )
    unknown_keys = sorted(set(scouts) - set(SIGNAL_FAMILIES))
    if unknown_keys:
        raise ValueError(f"unknown scout families: {', '.join(unknown_keys)}")

    def plan_node(state: GraphState) -> GraphState:
        from research_agent.graph import default_planner

        try:
            plan = default_planner(state["product"])
        except Exception as exc:  # noqa: BLE001 - recorded, verdict still produced
            return {**state, "plan": [],
                    "errors": [*state.get("errors", []),
                               f"planner failed: {type(exc).__name__}: {exc}"]}
        return {**state, "plan": plan}

    def scout_node(state: GraphState) -> GraphState:
        def run_one(item: tuple[str, Scout]) -> tuple[list[dict], list[str]]:
            family, scout = item
            try:
                raw = scout(state["product"])
            except Exception as exc:  # noqa: BLE001 - recorded, verdict still produced
                return [], [f"scout {family!r} failed: {type(exc).__name__}: {exc}"]
            accepted: list[dict] = []
            errors: list[str] = []
            for signal in raw:
                if signal.family != family:
                    errors.append(
                        f"scout {family!r} returned a {signal.family!r} signal; "
                        "quarantined (family must match the scout key)"
                    )
                    continue
                accepted.append(asdict(signal))
            return accepted, errors

        items = list(scouts.items())
        if len(items) > 1:
            with ThreadPoolExecutor(max_workers=len(items)) as pool:
                results = list(pool.map(run_one, items))
        else:
            results = [run_one(item) for item in items]
        signals: list[dict] = []
        errors: list[str] = list(state.get("errors", []))
        for accepted, errs in results:
            signals.extend(accepted)
            errors.extend(errs)
        missing = [f for f in SIGNAL_FAMILIES if f not in scouts]
        return {**state, "signals": signals, "errors": errors,
                "missing_families": missing}

    def analyze_node(state: GraphState) -> GraphState:
        from research_agent.rules import count_agreeing_families

        signals = _signals_from_dicts(state.get("signals", []))
        analysis = (f"{count_agreeing_families(signals)} "
                    "independent families agree.")
        if state.get("missing_families"):
            analysis += (" Missing families (not scouted): "
                         f"{', '.join(state['missing_families'])}.")
        return {**state, "analysis": analysis}

    def verify_node(state: GraphState) -> GraphState:
        attempts = state.get("attempts", 0) + 1
        if verifier is None:
            # No verifier wired: unverified (None), never True (B2-5).
            return {**state, "attempts": attempts, "verified": None,
                    "best_effort": False}
        try:
            passed = verifier(state)
        except Exception as exc:  # noqa: BLE001 - a failing verifier is a failed attempt
            errors = [*state.get("errors", []),
                      f"verifier failed: {type(exc).__name__}: {exc}"]
            passed = False
            return {**state, "attempts": attempts, "verified": False,
                    "best_effort": attempts >= max_attempts, "errors": errors}
        if passed:
            return {**state, "attempts": attempts, "verified": True,
                    "best_effort": False}
        return {**state, "attempts": attempts, "verified": False,
                "best_effort": attempts >= max_attempts}

    def route_after_verify(state: GraphState) -> str:
        # Retry while the verifier failed AND attempts remain; else verdict.
        if state.get("verified") is True or state.get("verified") is None:
            return "verdict"
        if state.get("attempts", 0) < max_attempts:
            return "verify"
        return "verdict"

    def verdict_node(state: GraphState) -> GraphState:
        from research_agent.rules import decide_verdict

        signals = _signals_from_dicts(state.get("signals", []))
        verdict = decide_verdict(
            signals, state["product"],
            best_effort=bool(state.get("best_effort", False)),
            weak_critical_families=tuple(
                state.get("weak_critical_families", ())),
            outcome_record_id=state.get("outcome_record_id"),
            prior_record_id=state.get("prior_record_id"))
        errors = list(state.get("errors", []))
        if verdict.incomplete and verdict.incomplete_reason:
            errors.append(
                f"verdict incomplete: {verdict.incomplete_reason}")
        return {**state, "verdict": verdict, "errors": errors}

    graph: object = StateGraph(GraphState)
    graph.add_node("plan", plan_node)  # type: ignore[attr-defined]
    graph.add_node("scout", scout_node)  # type: ignore[attr-defined]
    graph.add_node("analyze", analyze_node)  # type: ignore[attr-defined]
    graph.add_node("verify", verify_node)  # type: ignore[attr-defined]
    graph.add_node("verdict", verdict_node)  # type: ignore[attr-defined]
    graph.set_entry_point("plan")  # type: ignore[attr-defined]
    graph.add_edge("plan", "scout")  # type: ignore[attr-defined]
    graph.add_edge("scout", "analyze")  # type: ignore[attr-defined]
    graph.add_edge("analyze", "verify")  # type: ignore[attr-defined]
    graph.add_conditional_edges(  # type: ignore[attr-defined]
        "verify", route_after_verify, {"verify": "verify", "verdict": "verdict"}
    )
    graph.add_edge("verdict", END)  # type: ignore[attr-defined]
    if checkpointer is not None:
        return graph.compile(checkpointer=checkpointer)  # type: ignore[attr-defined]
    return graph.compile()  # type: ignore[attr-defined]
