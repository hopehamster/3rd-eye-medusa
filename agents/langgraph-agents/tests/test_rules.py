"""Tests for the 3-signal rule (TDD RED first). Stdlib unittest only: no
live services, no network, mocked scouts everywhere."""

import unittest

from research_agent.rules import count_agreeing_families, decide_verdict
from research_agent.state import Signal, Verdict


def sig(family: str, direction: str = "agree", strength: float = 0.8) -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=strength, evidence="mocked evidence", source="mock")


class TestThreeSignalRule(unittest.TestCase):
    def test_two_agreeing_families_is_skip(self) -> None:
        verdict = decide_verdict([sig("social_velocity"), sig("search_demand")])
        self.assertEqual(verdict.decision, "skip")
        self.assertEqual(count_agreeing_families([sig("social_velocity"), sig("search_demand")]), 2)

    def test_three_independent_agreeing_families_is_list(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"), sig("supplier_proof")]
        verdict = decide_verdict(signals)
        self.assertEqual(verdict.decision, "list")
        self.assertEqual(count_agreeing_families(signals), 3)

    def test_three_signals_same_family_count_once(self) -> None:
        signals = [sig("social_velocity"), sig("social_velocity"), sig("social_velocity")]
        self.assertEqual(count_agreeing_families(signals), 1)
        self.assertEqual(decide_verdict(signals).decision, "skip")

    def test_disagree_does_not_count_toward_agreement(self) -> None:
        signals = [sig("social_velocity"), sig("search_demand"),
                   sig("supplier_proof", direction="disagree"), sig("margin_math")]
        self.assertEqual(count_agreeing_families(signals), 3)
        self.assertEqual(decide_verdict(signals).decision, "list")

    def test_verdict_carries_reasoning_confidence_and_approval_gate(self) -> None:
        verdict = decide_verdict([sig("social_velocity"), sig("search_demand"), sig("margin_math")])
        self.assertIsInstance(verdict, Verdict)
        self.assertTrue(verdict.reasoning)
        self.assertGreaterEqual(verdict.confidence, 0.0)
        self.assertLessEqual(verdict.confidence, 1.0)
        # Human-approval gate: nothing from this agent may touch catalog/order flow
        # without approval, even on a LIST verdict.
        self.assertTrue(verdict.requires_human_approval)


if __name__ == "__main__":
    unittest.main()
