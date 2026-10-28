"""The veto-first-then-count rule and verdict logic. Pure functions, no I/O.

Order (Michael 2026-10-27, comment 6460788465 — confirmed for BOTH the
quick everyday check and the deep-dive check):

1. VETO CHECK FIRST, on the final signals at verdict time. A
   disagreeing supplier_proof or margin_math signal WITH checkable
   evidence vetoes a LIST: the verdict is SKIP however many other
   families agree. The count rule decides LIST-eligibility only among
   candidates that pass the veto check; it cannot override a veto.
2. THEN the 3-signal rule: at least 3 INDEPENDENT signal families must
   agree before a product may be listed. Three signals from one family
   count as one — independence is by family, not by count.

Evidence bar (same correction):
- A neutral / "no evidence found" critical signal is NOT a veto — it
  is a missing family, and the count rule decides.
- A disagree direction returned WITHOUT checkable evidence (empty
  evidence) is treated as missing, not as a veto: it neither vetoes
  nor counts as agreement, and the reasoning names it as evidence-less.
- Weak/shaky vs strong: signal strength alone NEVER softens a veto.
  A critical disagreement flagged weak/shaky by the verify/evidence
  assessment (passed as weak_critical_families) does NOT veto — it
  escalates to Michael through the amber queue (see
  approval.queue_tier). Strength is a score, not an evidence
  assessment; only the explicit weak flag changes veto treatment,
  because no strength cutoff was set by any decision. Who may set
  the flag: ONLY the verify/evidence assessment. It is not a general
  caller flag, and the wiring leg must accept weak flags only from
  that assessment. The flag is persisted on the Verdict
  (weak_critical_families) and in the outcome record, so a downgrade
  from automatic no to amber escalation is reconstructable.
- Re-judgements: a re-judgement of a vetoed candidate links to the
  prior vetoed record id (prior_record_id) and retains its corrected
  signals on the new record. The prior record is never overwritten,
  so a corrected-signal re-run is distinguishable from a sanitized
  re-run (disagreeing signal dropped, no prior link).
- Verify lifts a veto ONLY by correcting the signal: decide_verdict
  is pure over its inputs, so a corrected signal list (supplier live
  again, margin recomputed and passing) yields no veto. A veto is
  never lifted by reasoning alone, and failed verification leaves
  the veto standing (the graph delivers the veto-SKIP best-effort).

A verdict is a recommendation; the human-approval gate lives on
Verdict itself, and the approval check lives in approval.py (B2-8).

Confidence is INFORMATIONAL ONLY (B2-3): it is the mean strength of
agreeing signals and never gates LIST. Disagreeing signals do not lower
it — they are named in the reasoning instead (B2-2, soft conflicts).
"""

from research_agent.state import Signal, Verdict

MIN_AGREEING_FAMILIES = 3

#: Families whose disagreement must be named in any LIST verdict (B2-2)
#: and whose evidenced disagreement vetoes a LIST.
CRITICAL_FAMILIES: tuple[str, ...] = ("supplier_proof", "margin_math")


def count_agreeing_families(signals: list[Signal]) -> int:
    """Distinct families with at least one agreeing signal."""
    return len({s.family for s in signals if s.direction == "agree"})


def _has_checkable_evidence(signal: Signal) -> bool:
    """Checkable evidence means a non-empty evidence string.

    An evidence-less disagree is "no evidence found" in substance,
    whatever direction label it carries.
    """
    return bool(signal.evidence and signal.evidence.strip())


def veto_check(
    signals: list[Signal],
    *,
    weak_critical_families: tuple[str, ...] | list[str] = (),
) -> list[str]:
    """Critical families whose disagreeing signal vetoes a LIST.

    Sorted, de-duplicated. A family vetoes only when it has a
    disagreeing signal with checkable evidence and is not flagged
    weak/shaky by the caller.
    """
    weak = set(weak_critical_families)
    vetoed = {
        s.family
        for s in signals
        if s.family in CRITICAL_FAMILIES
        and s.direction == "disagree"
        and _has_checkable_evidence(s)
        and s.family not in weak
    }
    return sorted(vetoed)


def decide_verdict(
    signals: list[Signal],
    product: str = "",
    *,
    best_effort: bool = False,
    weak_critical_families: tuple[str, ...] | list[str] = (),
    outcome_record_id: str | None = None,
    prior_record_id: str | None = None,
) -> Verdict:
    """Build a list-or-skip verdict from gathered signals.

    Veto first, then count. A vetoed candidate is SKIP even when
    three or more families agree.
    """
    agreeing = sorted({s.family for s in signals if s.direction == "agree"})
    disagreeing = sorted({s.family for s in signals if s.direction == "disagree"})
    vetoed = veto_check(signals, weak_critical_families=weak_critical_families)
    agreeing_signals = [s for s in signals if s.direction == "agree"]
    confidence = (
        sum(s.strength for s in agreeing_signals) / len(agreeing_signals)
        if agreeing_signals
        else 0.0
    )
    # Missing families: neutral critical signals, plus critical
    # disagrees returned without checkable evidence.
    missing: list[str] = []
    for s in signals:
        if s.family in CRITICAL_FAMILIES and s.direction == "neutral":
            missing.append(s.family)
        elif (
            s.family in CRITICAL_FAMILIES
            and s.direction == "disagree"
            and not _has_checkable_evidence(s)
        ):
            missing.append(s.family)
    missing = sorted(set(missing))
    weak = sorted(set(weak_critical_families) & set(disagreeing))

    if vetoed:
        decision = "skip"
    else:
        decision = "list" if len(agreeing) >= MIN_AGREEING_FAMILIES else "skip"

    parts = []
    if vetoed:
        parts.append(
            f"Veto: {', '.join(vetoed)} disagree with checkable evidence, "
            "so this candidate cannot be listed by the agent. "
            f"{len(agreeing)} independent signal famil"
            f"{'y' if len(agreeing) == 1 else 'ies'} agree "
            f"({', '.join(agreeing) if agreeing else 'none'}); "
            f"{MIN_AGREEING_FAMILIES} required — the count would otherwise "
            "have applied, but the veto is checked first and cannot be "
            "outvoted by trend signals."
        )
    else:
        parts.append(
            f"{len(agreeing)} independent signal famil"
            f"{'y' if len(agreeing) == 1 else 'ies'} "
            f"agree ({', '.join(agreeing) if agreeing else 'none'}); "
            f"{MIN_AGREEING_FAMILIES} required."
        )
    if best_effort:
        parts.append("best-effort verdict: verification did not pass within "
                     "the attempt budget, so this verdict is delivered "
                     "rather than hanging or failing with no answer.")
    if missing:
        parts.append(
            "Missing families (no evidence found, not a veto): "
            f"{', '.join(missing)}."
        )
    # Evidence-less critical disagrees are named as missing, never as a
    # veto and never as agreement.
    evidence_less = sorted({
        s.family for s in signals
        if s.family in CRITICAL_FAMILIES
        and s.direction == "disagree"
        and not _has_checkable_evidence(s)
    })
    if evidence_less:
        parts.append(
            "No checkable evidence for disagreeing "
            f"{', '.join(evidence_less)}; treated as missing, not a veto."
        )
    if weak:
        parts.append(
            "Weak/shaky critical disagreement (no automatic no): "
            f"{', '.join(weak)} — escalates to Michael through the "
            "human queue; the agent does not decide past it."
        )
    # Disagreement naming: on a LIST, every disagreeing family is named
    # with signal name + evidence (B2-2, soft conflicts); on a veto-SKIP
    # the vetoing families are named above, and any soft disagreement
    # is named here too so nothing is hidden.
    disagreeing_signals = [s for s in signals if s.direction == "disagree"]
    if disagreeing_signals:
        named = "; ".join(
            f"{s.family} disagrees ({s.name}: {s.evidence})"
            for s in disagreeing_signals
            if _has_checkable_evidence(s)
        )
        if named:
            parts.append(f"Disagreement noted: {named}.")
    if decision == "list":
        parts.append("Recommendation: LIST, subject to human approval.")
    else:
        parts.append("Recommendation: SKIP.")
    return Verdict(
        product=product,
        decision=decision,  # type: ignore[arg-type]
        agreeing_families=agreeing,
        disagreeing_families=disagreeing,
        vetoed_by=vetoed,
        reasoning=" ".join(parts),
        confidence=round(confidence, 3),
        outcome_record_id=outcome_record_id,
        weak_critical_families=weak,
        prior_record_id=prior_record_id,
    )
