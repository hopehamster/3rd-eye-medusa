"""Veto-first-then-count (Michael 2026-10-27, comment 6460788465:
confirmed for BOTH the quick check and the deep-dive check).

Written first; must FAIL against rules.py before the veto is implemented.
Stdlib unittest only: no live services, no network."""

import unittest

from research_agent.rules import decide_verdict, veto_check
from research_agent.state import Signal


def sig(family: str, direction: str = "agree", strength: float = 0.8,
        evidence: str = "mocked evidence") -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=strength, evidence=evidence, source="mock")


def three_agreeing_plus(critical_disagree: str) -> list[Signal]:
    families = ["social_velocity", "search_demand", "ad_longevity"]
    signals = [sig(f) for f in families]
    signals.append(sig(critical_disagree, direction="disagree"))
    return signals


class TestVetoFirstThenCount(unittest.TestCase):
    def test_veto_beats_three_agreeing_families(self) -> None:
        verdict = decide_verdict(three_agreeing_plus("supplier_proof"))
        self.assertEqual(verdict.decision, "skip")
        self.assertEqual(verdict.vetoed_by, ["supplier_proof"])
        self.assertIn("supplier_proof", verdict.disagreeing_families)

    def test_margin_veto_beats_three_agreeing_families(self) -> None:
        verdict = decide_verdict(three_agreeing_plus("margin_math"))
        self.assertEqual(verdict.decision, "skip")
        self.assertEqual(verdict.vetoed_by, ["margin_math"])

    def test_veto_check_lists_every_vetoing_family(self) -> None:
        signals = [sig("social_velocity"),
                   sig("supplier_proof", direction="disagree"),
                   sig("margin_math", direction="disagree")]
        self.assertEqual(veto_check(signals), ["margin_math", "supplier_proof"])

    def test_veto_reasoning_names_veto_and_count_that_would_apply(self) -> None:
        verdict = decide_verdict(three_agreeing_plus("supplier_proof"))
        self.assertIn("veto", verdict.reasoning.lower())
        self.assertIn("supplier_proof", verdict.reasoning)
        self.assertIn("3", verdict.reasoning)

    def test_no_veto_when_critical_agrees(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"),
                   sig("supplier_proof")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "list")
        self.assertEqual(verdict.vetoed_by, [])
        self.assertEqual(verdict.disagreeing_families, [])

    def test_soft_disagreement_does_not_veto(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"),
                   sig("supplier_proof"),
                   sig("ad_longevity", direction="disagree")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "list")
        self.assertEqual(verdict.vetoed_by, [])
        self.assertIn("ad_longevity", verdict.disagreeing_families)
        self.assertIn("ad_longevity", verdict.reasoning)


class TestNeutralAndEvidenceBar(unittest.TestCase):
    def test_neutral_critical_is_missing_not_veto(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"),
                   sig("supplier_proof", direction="neutral",
                       evidence="no evidence found")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.vetoed_by, [])
        self.assertEqual(verdict.decision, "skip")  # only 2 agreeing families
        self.assertIn("missing", verdict.reasoning.lower())

    def test_evidence_less_critical_disagree_is_not_veto(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"),
                   sig("margin_math"),
                   sig("supplier_proof", direction="disagree", evidence="")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.vetoed_by, [])
        self.assertEqual(verdict.decision, "list")
        self.assertIn("no checkable evidence", verdict.reasoning.lower())

    def test_strength_alone_never_softens_a_veto(self) -> None:
        # A weak-strength critical disagree with checkable evidence still
        # vetoes unless the caller explicitly flags it weak/shaky.
        for strength in (0.1, 0.9):
            verdict = decide_verdict(three_agreeing_plus("supplier_proof")
                                     if False else
                                     [sig("social_velocity"), sig("search_demand"),
                                      sig("ad_longevity"),
                                      sig("supplier_proof", direction="disagree",
                                          strength=strength)])
            self.assertEqual(verdict.vetoed_by, ["supplier_proof"],
                             f"strength {strength} must not soften a veto")
            self.assertEqual(verdict.decision, "skip")

    def test_explicitly_weak_critical_disagree_escalates_not_vetoes(self) -> None:
        # Weak/shaky bad signal: no automatic no; the human decides via
        # the amber queue (see test_approval queue tier for weak items).
        signals = three_agreeing_plus("supplier_proof")
        verdict = decide_verdict(signals, weak_critical_families=("supplier_proof",))
        self.assertEqual(verdict.vetoed_by, [])
        self.assertEqual(verdict.decision, "list")
        self.assertIn("supplier_proof", verdict.disagreeing_families)

    def test_verification_lifts_veto_only_by_correcting_signal(self) -> None:
        # Same candidate, corrected signal: supplier now live.
        vetoed = decide_verdict(three_agreeing_plus("supplier_proof"))
        self.assertEqual(vetoed.vetoed_by, ["supplier_proof"])
        corrected = [sig("social_velocity"), sig("search_demand"),
                     sig("ad_longevity"), sig("supplier_proof")]
        lifted = decide_verdict(corrected)
        self.assertEqual(lifted.vetoed_by, [])
        self.assertEqual(lifted.decision, "list")


class TestVerdictFields(unittest.TestCase):
    def test_verdict_carries_disagreeing_vetoed_and_outcome_record_id(self) -> None:
        verdict = decide_verdict(three_agreeing_plus("supplier_proof"),
                                 outcome_record_id="rec-123")
        self.assertEqual(verdict.outcome_record_id, "rec-123")
        self.assertEqual(verdict.disagreeing_families, ["supplier_proof"])
        self.assertTrue(verdict.requires_human_approval)

    def test_outcome_record_id_defaults_to_none(self) -> None:
        verdict = decide_verdict([sig("social_velocity")])
        self.assertIsNone(verdict.outcome_record_id)

    def test_vetoed_verdict_is_never_list(self) -> None:
        verdict = decide_verdict(three_agreeing_plus("margin_math"))
        self.assertNotEqual(verdict.decision, "list")
        self.assertTrue(verdict.vetoed_by)


if __name__ == "__main__":
    unittest.main()
