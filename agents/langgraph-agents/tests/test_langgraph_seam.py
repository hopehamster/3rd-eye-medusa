"""Tests for the LangGraph seam: same node/edge/state shape, importable
without LangGraph installed, and honest about availability."""

import unittest

from research_agent import langgraph_adapter
from research_agent.graph import NODES


class TestLangGraphSeam(unittest.TestCase):
    def test_node_order_matches_spec(self) -> None:
        self.assertEqual(NODES, ["plan", "scout", "analyze", "verify", "verdict"])

    def test_adapter_reports_availability_honestly(self) -> None:
        self.assertIsInstance(langgraph_adapter.HAS_LANGGRAPH, bool)

    def test_adapter_without_langgraph_raises_clear_error_not_fake_graph(self) -> None:
        if langgraph_adapter.HAS_LANGGRAPH:
            self.skipTest("LangGraph is installed; seam path differs")
        with self.assertRaises(RuntimeError) as ctx:
            langgraph_adapter.build_langgraph_graph({})
        self.assertIn("langgraph", str(ctx.exception).lower())

    def test_no_secrets_in_module(self) -> None:
        import pathlib
        import re
        root = pathlib.Path(__file__).resolve().parents[1]
        secretish = re.compile(r"sk-[A-Za-z0-9]{8,}|api_key\s*=|API_KEY\s*=")
        for path in root.rglob("*.py"):
            if ".venv" in path.parts:
                continue
            self.assertIsNone(
                secretish.search(path.read_text()),
                f"{path} looks like it holds a secret")


if __name__ == "__main__":
    unittest.main()
