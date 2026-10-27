"""State objects carried between graph nodes.

These are plain data: no I/O, no LLM, no network. A later LangGraph port
uses the same fields as its graph state (see langgraph_adapter.py).
"""

from dataclasses import dataclass, field
from typing import Literal

Direction = Literal["agree", "disagree", "neutral"]
Decision = Literal["list", "skip"]

#: The five signal families, one sub-agent each (spec section 3).
SIGNAL_FAMILIES: tuple[str, ...] = (
    "social_velocity",
    "ad_longevity",
    "search_demand",
    "supplier_proof",
    "margin_math",
)


@dataclass
class Signal:
    """One observation from one sub-agent about one candidate product.

    ``direction`` is the sub-agent's judgment, not raw data: "agree" means
    this signal supports listing the product.
    """

    family: str
    name: str
    direction: Direction
    strength: float  # 0.0-1.0, how strong this signal is
    evidence: str  # short, checkable summary (URL, count, quote, figure)
    source: str  # which scout/tool produced it (mock name in tests)

    def __post_init__(self) -> None:
        if not 0.0 <= self.strength <= 1.0:
            raise ValueError(f"Signal strength out of range: {self.strength!r}")
        if self.direction not in ("agree", "disagree", "neutral"):
            raise ValueError(f"Unknown signal direction: {self.direction!r}")
        # B2-3: family membership is enforced at construction. An unknown
        # family is REJECTED (never counted, never quarantined-into a
        # verdict): a typo or misbehaving scout cannot manufacture a LIST.
        if self.family not in SIGNAL_FAMILIES:
            raise ValueError(
                f"Unknown signal family: {self.family!r} "
                f"(known families: {', '.join(SIGNAL_FAMILIES)})"
            )


@dataclass
class Verdict:
    """The list-or-skip outcome. This is a recommendation, not an action.

    confidence is INFORMATIONAL ONLY (B2-3): it never gates the decision.
    LIST depends on the agreeing-family count alone; a low-confidence
    LIST and a high-confidence SKIP are both possible by design.
    """

    product: str
    decision: Decision
    agreeing_families: list[str]
    reasoning: str
    confidence: float  # 0.0-1.0, informational only — never a LIST bar
    # HARD GATE: even a LIST verdict touches no catalog/order flow until a
    # human approves it. The agent layer never lists on its own.
    requires_human_approval: bool = True


@dataclass
class AgentState:
    """Everything the graph carries from node to node."""

    product: str
    plan: list[str] = field(default_factory=list)
    signals: list[Signal] = field(default_factory=list)
    analysis: str = ""
    # verified: True = verifier passed; False = verifier ran and failed
    # (best-effort verdict); None = NO verifier wired — distinct from
    # failed (B2-5). Never report None as "verified".
    verified: bool | None = None
    attempts: int = 0
    max_attempts: int = 3
    verdict: Verdict | None = None
    # Failures recorded, never swallowed: scout/planner/verifier
    # exceptions land here and the run still produces a verdict (B2-5).
    errors: list[str] = field(default_factory=list)
    # Families in SIGNAL_FAMILIES with no scout in this run (B2-7).
    missing_families: list[str] = field(default_factory=list)
