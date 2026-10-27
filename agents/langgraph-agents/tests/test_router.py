"""Escalation-only router (B2-4, coordinator amendment to #122).

Quantified triggers: conflict threshold, novelty definition, spend
threshold, first-pass-verification-failure condition. Written first;
must FAIL (no router module) against the old skeleton."""

import unittest

from research_agent.router import (
    SPEND_THRESHOLD_USD,
    EscalationInput,
    decide_route,
    route_from_signals,
)
from research_agent.state import Signal


def sig(family: str, direction: str = "agree") -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=0.8, evidence="mocked", source="mock")


def base(**overrides) -> EscalationInput:
    kw = {
        "disagreeing_families": [],
        "disagreeing_total": 0,
        "has_score_history": True,
        "estimated_spend_usd": 0.0,
        "first_pass_verified": True,
    }
    kw.update(overrides)
    return EscalationInput(**kw)


class TestRouter(unittest.TestCase):
    def test_no_trigger_stays_on_default_path(self) -> None:
        decision = decide_route(base())
        self.assertFalse(decision.escalate)
        self.assertEqual(decision.triggers, [])

    def test_critical_family_disagreement_escalates(self) -> None:
        decision = decide_route(base(disagreeing_families=["supplier_proof"],
                                     disagreeing_total=1))
        self.assertTrue(decision.escalate)
        self.assertIn("conflict", decision.triggers)

    def test_two_noncritical_disagreements_escalate(self) -> None:
        decision = decide_route(base(disagreeing_families=["social_velocity", "search_demand"],
                                     disagreeing_total=2))
        self.assertTrue(decision.escalate)
        self.assertIn("conflict", decision.triggers)

    def test_single_noncritical_disagreement_does_not_escalate(self) -> None:
        decision = decide_route(base(disagreeing_families=["social_velocity"],
                                     disagreeing_total=1))
        self.assertFalse(decision.escalate)

    def test_novelty_escalates(self) -> None:
        decision = decide_route(base(has_score_history=False))
        self.assertTrue(decision.escalate)
        self.assertIn("novelty", decision.triggers)

    def test_spend_threshold_boundary(self) -> None:
        self.assertEqual(SPEND_THRESHOLD_USD, 500.0)
        self.assertTrue(decide_route(base(estimated_spend_usd=500.0)).escalate)
        self.assertFalse(decide_route(base(estimated_spend_usd=499.99)).escalate)
        self.assertIn("high_spend",
                      decide_route(base(estimated_spend_usd=500.0)).triggers)

    def test_first_pass_verification_failure_escalates(self) -> None:
        decision = decide_route(base(first_pass_verified=False))
        self.assertTrue(decision.escalate)
        self.assertIn("first_pass_verification_failed", decision.triggers)

    def test_route_from_signals_derives_conflict(self) -> None:
        signals = [sig("social_velocity"), sig("supplier_proof", direction="disagree")]
        decision = route_from_signals(signals, has_score_history=True,
                                      estimated_spend_usd=0.0,
                                      first_pass_verified=True)
        self.assertTrue(decision.escalate)
        self.assertIn("conflict", decision.triggers)


if __name__ == "__main__":
    unittest.main()
