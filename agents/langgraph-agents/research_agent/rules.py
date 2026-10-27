"""The 3-signal rule and verdict logic. Pure functions, no I/O.

Rule: at least 3 INDEPENDENT signal families must agree before a product
may be listed. Three signals from one family count as one — independence
is by family, not by count. Anything else is SKIP. A verdict is a
recommendation; the human-approval gate lives on Verdict itself.

Confidence is INFORMATIONAL ONLY (B2-3): it is the mean strength of
agreeing signals and never gates LIST. Disagreeing signals do not lower
it — they are named in the reasoning instead (B2-2).
"""

from research_agent.state import Signal, Verdict

MIN_AGREEING_FAMILIES = 3

#: Families whose disagreement must be named in any LIST verdict (B2-2).
CRITICAL_FAMILIES: tuple[str, ...] = ("supplier_proof", "margin_math")


def count_agreeing_families(signals: list[Signal]) -> int:
    """Distinct families with at least one agreeing signal."""
    return len({s.family for s in signals if s.direction == "agree"})


def decide_verdict(
    signals: list[Signal],
    product: str = "",
    *,
    best_effort: bool = False,
) -> Verdict:
    """Build a list-or-skip verdict from gathered signals."""
    agreeing = sorted({s.family for s in signals if s.direction == "agree"})
    agreeing_signals = [s for s in signals if s.direction == "agree"]
    confidence = (
        sum(s.strength for s in agreeing_signals) / len(agreeing_signals)
        if agreeing_signals
        else 0.0
    )
    decision = "list" if len(agreeing) >= MIN_AGREEING_FAMILIES else "skip"
    parts = [
        f"{len(agreeing)} independent signal famil{'y' if len(agreeing) == 1 else 'ies'} "
        f"agree ({', '.join(agreeing) if agreeing else 'none'}); "
        f"{MIN_AGREEING_FAMILIES} required.",
    ]
    if best_effort:
        parts.append("best-effort verdict: verification did not pass within "
                     "the attempt budget, so this verdict is delivered "
                     "rather than hanging or failing with no answer.")
    # B2-2: a LIST verdict must name disagreeing signals — at minimum the
    # critical families (supplier_proof, margin_math), in practice every
    # disagreeing family, with the signal name and evidence. A LIST that
    # hides a supplier/margin objection is exactly what this rule prevents.
    if decision == "list":
        disagreeing = [s for s in signals if s.direction == "disagree"]
        if disagreeing:
            named = "; ".join(
                f"{s.family} disagrees ({s.name}: {s.evidence})" for s in disagreeing
            )
            parts.append(f"Disagreement noted: {named}.")
    if decision == "list":
        parts.append("Recommendation: LIST, subject to human approval.")
    else:
        parts.append("Recommendation: SKIP.")
    return Verdict(
        product=product,
        decision=decision,  # type: ignore[arg-type]
        agreeing_families=agreeing,
        reasoning=" ".join(parts),
        confidence=round(confidence, 3),
    )
