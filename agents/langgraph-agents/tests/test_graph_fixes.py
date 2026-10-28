"""Graph fixes (B2-5 exceptions + verifier=None, B2-7 parallel/scout keys/
missing families/wrong-family quarantine). Written first; must FAIL
against the old graph.py."""

import unittest

from research_agent.graph import run_research
from research_agent.state import AgentState, Signal


def agreeing_scout(family: str):
    def scout(product: str) -> list[Signal]:
        return [Signal(family=family, name=f"mock-{family}", direction="agree",
                       strength=0.9, evidence="mocked", source="mock-scout")]
    return scout


class TestVerifierNone(unittest.TestCase):
    def test_no_verifier_means_unverified_not_verified(self) -> None:
        state = run_research("mock product", scouts={
            "social_velocity": agreeing_scout("social_velocity")})
        self.assertIsNone(state.verified)  # distinct from False (failed)
        self.assertEqual(state.attempts, 0)
        self.assertIsNotNone(state.verdict)


class TestExceptionTolerance(unittest.TestCase):
    def test_scout_exception_still_yields_verdict(self) -> None:
        def boom(product: str) -> list[Signal]:
            raise RuntimeError("scout exploded")

        state = run_research("mock product", scouts={
            "social_velocity": boom,
            "search_demand": agreeing_scout("search_demand")})
        self.assertIsNotNone(state.verdict)
        self.assertTrue(any("social_velocity" in e for e in state.errors))

    def test_planner_exception_still_yields_verdict(self) -> None:
        def boom_planner(product: str) -> list[str]:
            raise RuntimeError("planner exploded")

        state = run_research("mock product",
                             scouts={"social_velocity": agreeing_scout("social_velocity")},
                             planner=boom_planner)
        self.assertIsNotNone(state.verdict)
        self.assertTrue(state.errors)

    def test_verifier_exception_counts_as_failed_attempt(self) -> None:
        def boom_verify(state: AgentState) -> bool:
            raise RuntimeError("verifier exploded")

        state = run_research("mock product",
                             scouts={"social_velocity": agreeing_scout("social_velocity")},
                             verifier=boom_verify, max_attempts=2)
        self.assertEqual(state.attempts, 2)
        self.assertFalse(state.verified)
        self.assertIsNotNone(state.verdict)
        assert state.verdict is not None
        self.assertIn("best-effort", state.verdict.reasoning)


class TestScoutValidation(unittest.TestCase):
    def test_unknown_scout_key_rejected(self) -> None:
        with self.assertRaises(ValueError):
            run_research("mock product", scouts={
                "typo_family": agreeing_scout("typo_family")})

    def test_missing_families_recorded_not_hidden(self) -> None:
        state = run_research("mock product", scouts={
            "social_velocity": agreeing_scout("social_velocity")})
        self.assertIn("search_demand", state.missing_families)
        self.assertIn("missing", state.analysis.lower())

    def test_wrong_family_signal_quarantined(self) -> None:
        def lying_scout(product: str) -> list[Signal]:
            # Keyed social_velocity but returns a search_demand signal.
            return [Signal(family="search_demand", name="lie", direction="agree",
                           strength=0.9, evidence="mocked", source="mock")]

        state = run_research("mock product", scouts={"social_velocity": lying_scout})
        self.assertEqual(state.signals, [])
        self.assertTrue(any("quarantine" in e.lower() for e in state.errors))


class TestParallelFanOut(unittest.TestCase):
    def test_parallel_and_sequential_agree(self) -> None:
        families = ["social_velocity", "ad_longevity", "search_demand",
                    "supplier_proof", "margin_math"]
        scouts = {f: agreeing_scout(f) for f in families}
        parallel = run_research("mock product", scouts=scouts, parallel=True)
        sequential = run_research("mock product", scouts=scouts, parallel=False)
        self.assertEqual(parallel.verdict.decision, "list")
        self.assertEqual(sequential.verdict.decision, "list")
        self.assertEqual(len(parallel.signals), len(sequential.signals))


if __name__ == "__main__":
    unittest.main()
