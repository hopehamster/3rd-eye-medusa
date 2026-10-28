"""Rules fixes (B2-2 disagree naming, B2-3 family validation + confidence
informational). Written first; must FAIL against the old rules/state."""

import unittest

from research_agent.rules import decide_verdict
from research_agent.state import Signal


def sig(family: str, direction: str = "agree", strength: float = 0.8) -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=strength, evidence="mocked evidence", source="mock")


class TestDisagreeNaming(unittest.TestCase):
    # Pre-veto versions expected LIST over a critical disagree; the
    # veto fold supersedes them. Soft (non-critical) disagreement is
    # still named on a LIST; critical disagreement now vetoes to SKIP
    # and is named on the veto-SKIP.
    def test_veto_skip_names_disagreeing_supplier_proof(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"), sig("margin_math"),
                   sig("supplier_proof", direction="disagree")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "skip")
        self.assertEqual(verdict.vetoed_by, ["supplier_proof"])
        self.assertIn("supplier_proof", verdict.reasoning)

    def test_veto_skip_names_disagreeing_margin_math(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"), sig("supplier_proof"),
                   sig("margin_math", direction="disagree")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "skip")
        self.assertEqual(verdict.vetoed_by, ["margin_math"])
        self.assertIn("margin_math", verdict.reasoning)

    def test_list_verdict_names_soft_disagreement(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"), sig("supplier_proof"),
                   sig("ad_longevity", direction="disagree")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "list")
        self.assertIn("ad_longevity", verdict.reasoning)


class TestFamilyValidation(unittest.TestCase):
    def test_unknown_family_rejected_at_construction(self) -> None:
        with self.assertRaises(ValueError):
            Signal(family="typo_family", name="x", direction="agree",
                   strength=0.8, evidence="e", source="mock")

    def test_three_invented_families_cannot_produce_list(self) -> None:
        # They cannot even be constructed, so no verdict can count them.
        with self.assertRaises(ValueError):
            [Signal(family=f, name="x", direction="agree", strength=0.9,
                    evidence="e", source="mock")
             for f in ("typo_family", "another_typo", "third_typo")]


class TestConfidenceInformational(unittest.TestCase):
    def test_weak_signals_still_list_on_family_count(self) -> None:
        # Confidence is INFORMATIONAL ONLY (stated in spec + rules): LIST
        # depends on family count alone, never on a confidence bar.
        signals = [sig("social_velocity", strength=0.1),
                   sig("search_demand", strength=0.1),
                   sig("margin_math", strength=0.1)]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "list")
        self.assertAlmostEqual(verdict.confidence, 0.1)


if __name__ == "__main__":
    unittest.main()
