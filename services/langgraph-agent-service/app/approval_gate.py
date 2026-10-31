"""Wiring-leg approval gate (B2-8) for the B1 service leg.

This module is a thin adapter over the canonical gate in
b2-agent/research_agent/approval.py — it does NOT duplicate the gate
logic, so the veto/override rules cannot drift between the agent leg
and the service leg. The import resolves the team-work tree layout
(b1-service/app -> team-work/b2-agent); if that layout is not
present, the import fails loudly rather than silently substituting
a second gate implementation.
"""

import sys
from pathlib import Path

# The canonical gate lives in the agent package at
# <repo>/agents/langgraph-agents/research_agent/approval.py.
# (It used to sit at <team-work>/b2-agent — that directory does not exist in
# this repo, so this import failed with ModuleNotFoundError.)
_REPO_ROOT = Path(__file__).resolve().parents[3]
_AGENT_PKG = _REPO_ROOT / "agents" / "langgraph-agents"
if str(_AGENT_PKG) not in sys.path:
    sys.path.insert(0, str(_AGENT_PKG))

from research_agent.approval import (  # noqa: E402
    Approval,
    RecheckReference,
    authorize_catalog_write,
    authorize_dev_change,
    authorize_state_change,
    green_audit_mode,
    override_queue_tier,
    queue_tier,
)

__all__ = [
    "Approval",
    "RecheckReference",
    "authorize_catalog_write",
    "authorize_dev_change",
    "authorize_state_change",
    "green_audit_mode",
    "override_queue_tier",
    "queue_tier",
]
