"""Escalation router: composite+judge (default) -> deep agent (escalation).

Coordinator amendment to #122 (B2-4): the deep agent is ESCALATION-ONLY.
The #83 composite score plus one LLM judging step is the default verdict
path; this router decides, from quantified triggers, whether a candidate
goes to the deep agent. No trigger fires on prose — every trigger has a
number or a boolean below, and decide_route returns which triggers fired.

QUANTIFIED TRIGGERS (fix-pass values, per the coordinator mandate to
quantify — these numbers are NOT Michael-approved; the coordinator /
Michael may retune them, but they may not be left as prose):
- conflict: a disagreeing signal in a CRITICAL family (supplier_proof,
  margin_math), OR at least CONFLICT_MIN_DISAGREEING_TOTAL disagreeing
  signals in total. One non-critical disagreement alone does not escalate.
- novelty: has_score_history is False — the category/product has no
  prior composite-score history to judge against.
- high_spend: DEFERRED (Michael 2026-10-27, comment 6460788465:
  estimated spend is deferred, playing by ear, left undefined).
  estimated_spend_usd is kept as an optional placeholder field only:
  it NEVER triggers escalation, NEVER blocks a route, and has NO
  threshold defined anywhere in this module. Defining it, gating on
  it, or inventing a spend figure would contradict the deferral.
- first_pass_verification_failed: first_pass_verified is False — the
  default path's own first-pass verification (supplier proof / margin
  math re-check) did not pass.

The router is pure and deterministic: same inputs, same decision. The
deep agent itself never decides whether it should have run.
"""

from dataclasses import dataclass, field

from research_agent.state import Signal

#: Total disagreeing signals that escalate even with no critical family.
CONFLICT_MIN_DISAGREEING_TOTAL: int = 2

#: Families whose disagreement alone escalates (supplier/margin objections
#: are the ones a routine verdict must not overrule silently).
CRITICAL_FAMILIES: tuple[str, ...] = ("supplier_proof", "margin_math")


@dataclass
class EscalationInput:
    """Everything the router needs — all quantified, nothing prose."""

    disagreeing_families: list[str] = field(default_factory=list)
    disagreeing_total: int = 0
    has_score_history: bool = True
    estimated_spend_usd: float = 0.0
    first_pass_verified: bool = True


@dataclass
class RouteDecision:
    """Router output: escalate or stay on the default path, with reasons."""

    escalate: bool
    triggers: list[str] = field(default_factory=list)
    reason: str = ""


def decide_route(inp: EscalationInput) -> RouteDecision:
    """Route one candidate: deep agent (escalate) or default path."""
    triggers: list[str] = []
    if any(f in CRITICAL_FAMILIES for f in inp.disagreeing_families) or (
        inp.disagreeing_total >= CONFLICT_MIN_DISAGREEING_TOTAL
    ):
        triggers.append("conflict")
    if not inp.has_score_history:
        triggers.append("novelty")
    # No high_spend trigger: estimated spend is DEFERRED (see module
    # docstring). The field is an optional placeholder only.
    if not inp.first_pass_verified:
        triggers.append("first_pass_verification_failed")
    if triggers:
        return RouteDecision(
            escalate=True,
            triggers=triggers,
            reason=f"escalated to deep agent: {', '.join(triggers)}",
        )
    return RouteDecision(
        escalate=False,
        triggers=[],
        reason="no escalation trigger fired; default composite+judge path",
    )


def route_from_signals(
    signals: list[Signal],
    *,
    has_score_history: bool,
    estimated_spend_usd: float,
    first_pass_verified: bool,
) -> RouteDecision:
    """Convenience: build the router input from gathered signals."""
    disagreeing = [s for s in signals if s.direction == "disagree"]
    return decide_route(
        EscalationInput(
            disagreeing_families=sorted({s.family for s in disagreeing}),
            disagreeing_total=len(disagreeing),
            has_score_history=has_score_history,
            estimated_spend_usd=estimated_spend_usd,
            first_pass_verified=first_pass_verified,
        )
    )
