"""Research deep-agent skeleton (B2 leg).

Pure stdlib. No LLM calls, no network, no live tools: scouts, planner and
verifier are injected callables so tests (and later, B1's wiring) supply
mocked or real implementations. Secrets, when they exist, come from
environment variables at the wiring layer only — never here.
"""

from research_agent.graph import run_research
from research_agent.router import decide_route, route_from_signals
from research_agent.state import AgentState, Signal, Verdict

__all__ = ["AgentState", "Signal", "Verdict", "run_research",
           "decide_route", "route_from_signals"]
