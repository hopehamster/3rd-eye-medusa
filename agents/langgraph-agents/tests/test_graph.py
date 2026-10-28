"""Tests for the research graph: plan -> scout -> analyze -> verify -> verdict.

All scouts are injected callables (mocked sub-agents). No LLM, no network,
no live tools anywhere in this file."""

import unittest

from research_agent.graph import run_research
from research_agent.state import AgentState, Signal


def agreeing_scout(family: str):
    def scout(product: str) -> list[Signal]:
        return [Signal(family=family, name=f"mock-{family}", direction="agree",
                       strength=0.9, evidence="mocked", source="mock-scout")]
    return scout


class TestGraphVeto(unittest.TestCase):
    def test_veto_in_graph_beats_three_agreeing_scouts(self) -> None:
        def agree(family: str):
            def scout(product: str) -> list[Signal]:
                return [Signal(family=family, name="m", direction="agree",
                               strength=0.9, evidence="mocked", source="mock")]
            return scout
        def disagree_supplier(product: str) -> list[Signal]:
            return [Signal(family="supplier_proof", name="m",
                           direction="disagree", strength=0.9,
                           evidence="supplier listing dead", source="mock")]
        state = run_research("mock product", scouts={
            "social_velocity": agree("social_velocity"),
            "search_demand": agree("search_demand"),
            "ad_longevity": agree("ad_longevity"),
            "supplier_proof": disagree_supplier,
        }, outcome_record_id="rec-9")
        assert state.verdict is not None
        self.assertEqual(state.verdict.decision, "skip")
        self.assertEqual(state.verdict.vetoed_by, ["supplier_proof"])
        self.assertEqual(state.verdict.outcome_record_id, "rec-9")

    def test_failed_verification_leaves_veto_standing(self) -> None:
        def agree(family: str):
            def scout(product: str) -> list[Signal]:
                return [Signal(family=family, name="m", direction="agree",
                               strength=0.9, evidence="mocked", source="mock")]
            return scout
        def disagree_margin(product: str) -> list[Signal]:
            return [Signal(family="margin_math", name="m",
                           direction="disagree", strength=0.9,
                           evidence="margin does not clear costs", source="mock")]
        state = run_research("mock product", scouts={
            "social_velocity": agree("social_velocity"),
            "search_demand": agree("search_demand"),
            "margin_math": disagree_margin,
        }, verifier=lambda s: False, max_attempts=2)
        assert state.verdict is not None
        self.assertEqual(state.verdict.decision, "skip")
        self.assertEqual(state.verdict.vetoed_by, ["margin_math"])
        self.assertIn("best-effort", state.verdict.reasoning)


class TestGraph(unittest.TestCase):
    def test_plan_is_written_before_any_scout_call(self) -> None:
        order: list[str] = []

        def recording_scout(family: str):
            def scout(product: str) -> list[Signal]:
                order.append(f"scout:{family}")
                return []
            return scout

        # Planner records itself first; if scout runs before plan, order breaks.
        run_research("mock product", scouts={
            "social_velocity": recording_scout("social_velocity"),
        }, planner=lambda product: (order.append("plan"), ["social_velocity"])[1])
        self.assertEqual(order[0], "plan")

    def test_scout_fans_out_to_every_signal_family(self) -> None:
        called: list[str] = []

        def scout_for(family: str):
            def scout(product: str) -> list[Signal]:
                called.append(family)
                return [Signal(family=family, name="m", direction="agree",
                               strength=0.8, evidence="mocked", source="mock")]
            return scout

        families = ["social_velocity", "ad_longevity", "search_demand",
                    "supplier_proof", "margin_math"]
        state = run_research("mock product",
                             scouts={f: scout_for(f) for f in families})
        self.assertEqual(sorted(called), sorted(families))
        self.assertEqual(len(state.signals), 5)

    def test_three_agreeing_families_produce_list_verdict(self) -> None:
        state = run_research("mock product", scouts={
            "social_velocity": agreeing_scout("social_velocity"),
            "search_demand": agreeing_scout("search_demand"),
            "margin_math": agreeing_scout("margin_math"),
        })
        self.assertIsNotNone(state.verdict)
        assert state.verdict is not None
        self.assertEqual(state.verdict.decision, "list")

    def test_retry_loop_is_bounded_then_best_effort_verdict(self) -> None:
        attempts = {"n": 0}

        def flaky_verify(state: AgentState) -> bool:
            attempts["n"] += 1
            return False  # verification never passes

        state = run_research("mock product",
                             scouts={"social_velocity": agreeing_scout("social_velocity")},
                             verifier=flaky_verify, max_attempts=3)
        # Bounded: exactly max_attempts verify calls, then a verdict anyway.
        self.assertEqual(attempts["n"], 3)
        self.assertIsNotNone(state.verdict)
        assert state.verdict is not None
        self.assertEqual(state.verdict.decision, "skip")  # only 1 family agrees
        self.assertIn("best-effort", state.verdict.reasoning)

    def test_state_carries_plan_signals_and_verdict(self) -> None:
        state = run_research("mock product", scouts={
            "social_velocity": agreeing_scout("social_velocity"),
        })
        self.assertTrue(state.plan)
        self.assertTrue(state.signals)
        self.assertIsNotNone(state.verdict)

    def test_empty_scout_results_still_yield_skip_not_hang(self) -> None:
        state = run_research("mock product", scouts={
            "social_velocity": lambda product: [],
        })
        assert state.verdict is not None
        self.assertEqual(state.verdict.decision, "skip")


if __name__ == "__main__":
    unittest.main()
