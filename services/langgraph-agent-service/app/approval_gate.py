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

_TEAM_WORK = Path(__file__).resolve().parents[2]
_B2_AGENT = _TEAM_WORK / "b2-agent"
if str(_B2_AGENT) not in sys.path:
    sys.path.insert(0, str(_B2_AGENT))

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
