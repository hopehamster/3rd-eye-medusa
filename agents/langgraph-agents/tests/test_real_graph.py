"""Real LangGraph graph tests (B2-1). These run ONLY where LangGraph is
installed — B1's venv (langgraph 0.2.45) — and skip on a stdlib-only
interpreter. Written first; must FAIL against the old adapter, whose
verify node always passed on attempt 1 with no retry loop."""

import unittest

from research_agent import langgraph_adapter
from research_agent.state import Signal


def agreeing_scout(family: str):
    def scout(product: str) -> list[Signal]:
        return [Signal(family=family, name=f"mock-{family}", direction="agree",
                       strength=0.9, evidence="mocked", source="mock-scout")]
    return scout


@unittest.skipUnless(langgraph_adapter.HAS_LANGGRAPH, "LangGraph not installed here")
class TestRealGraph(unittest.TestCase):
    def test_failing_verifier_retries_then_best_effort(self) -> None:
        calls = {"n": 0}

        def failing_verifier(state: dict) -> bool:
            calls["n"] += 1
            return False

        graph = langgraph_adapter.build_langgraph_graph(
            {"social_velocity": agreeing_scout("social_velocity")},
            verifier=failing_verifier, max_attempts=3)
        result = graph.invoke({"product": "mock product"})
        self.assertEqual(calls["n"], 3)
        self.assertEqual(result["attempts"], 3)
        self.assertFalse(result["verified"])
        self.assertTrue(result["best_effort"])
        self.assertIsNotNone(result["verdict"])
        self.assertIn("best-effort", result["verdict"].reasoning)

    def test_passing_verifier_verifies_on_first_attempt(self) -> None:
        graph = langgraph_adapter.build_langgraph_graph(
            {"social_velocity": agreeing_scout("social_velocity")},
            verifier=lambda state: True, max_attempts=3)
        result = graph.invoke({"product": "mock product"})
        self.assertEqual(result["attempts"], 1)
        self.assertTrue(result["verified"])
        self.assertFalse(result["best_effort"])

    def test_no_verifier_is_unverified_not_verified(self) -> None:
        graph = langgraph_adapter.build_langgraph_graph(
            {"social_velocity": agreeing_scout("social_velocity")})
        result = graph.invoke({"product": "mock product"})
        self.assertIsNone(result["verified"])
        self.assertIsNotNone(result["verdict"])

    def test_checkpointer_accepted_and_thread_resumes(self) -> None:
        from langgraph.checkpoint.memory import MemorySaver

        graph = langgraph_adapter.build_langgraph_graph(
            {"social_velocity": agreeing_scout("social_velocity")},
            verifier=lambda state: True, checkpointer=MemorySaver())
        result = graph.invoke({"product": "mock product"},
                              config={"configurable": {"thread_id": "t-real-graph-1"}})
        self.assertTrue(result["verified"])
        self.assertIsNotNone(result["verdict"])

    def test_real_graph_verdict_matches_pure_python_rule(self) -> None:
        graph = langgraph_adapter.build_langgraph_graph({
            "social_velocity": agreeing_scout("social_velocity"),
            "search_demand": agreeing_scout("search_demand"),
            "margin_math": agreeing_scout("margin_math"),
        }, verifier=lambda state: True)
        result = graph.invoke({"product": "mock product"})
        self.assertEqual(result["verdict"].decision, "list")


if __name__ == "__main__":
    unittest.main()
