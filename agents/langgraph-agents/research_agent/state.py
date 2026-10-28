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
    LIST depends on passing the veto check first and then on the
    agreeing-family count; a low-confidence LIST and a high-confidence
    SKIP are both possible by design. A verdict with a non-empty
    vetoed_by MUST have decision "skip" — an agent LIST over a veto is
    a defect, not a judgement call (veto rule, Michael 2026-10-27).
    """

    product: str
    decision: Decision
    agreeing_families: list[str]
    reasoning: str
    confidence: float  # 0.0-1.0, informational only — never a LIST bar
    # HARD GATE: even a LIST verdict touches no catalog/order flow until a
    # human approves it. The agent layer never lists on its own.
    requires_human_approval: bool = True
    # All disagreeing families, critical and soft, so no disagreement
    # is hidden from the human approver.
    disagreeing_families: list[str] = field(default_factory=list)
    # Every critical family whose disagreeing signal vetoed a LIST;
    # empty when no veto applies.
    vetoed_by: list[str] = field(default_factory=list)
    # Id of the outcome record pre-created by the wiring leg (n8n/B1)
    # before the verdict is finalized; None means the run is incomplete
    # under the verdict contract (see outcome-record-spec.md).
    outcome_record_id: str | None = None
    # Critical families flagged weak/shaky by the verify/evidence
    # assessment (see rules.decide_verdict). Structured here and in
    # the outcome record so a veto downgraded to an amber escalation
    # is reconstructable, not prose-only. Only the verify/evidence
    # assessment may set this; it is never a general caller flag.
    weak_critical_families: list[str] = field(default_factory=list)
    # For a re-judgement of a candidate previously vetoed: the prior
    # vetoed record id. The prior record is never overwritten; the
    # new record's signals are the corrected signals, and this link
    # is what distinguishes a corrected-signal re-run from a
    # sanitized re-run (a re-run with the disagreeing signal dropped
    # and no prior link is not a correction).
    prior_record_id: str | None = None
    # Incomplete marker, set on the Verdict itself (not only at the
    # gate): True when outcome_record_id is None. The gate refuses
    # such a verdict, and the graph records it in state.errors.
    incomplete: bool = False
    incomplete_reason: str | None = None

    def __post_init__(self) -> None:
        if self.outcome_record_id is None:
            self.incomplete = True
            self.incomplete_reason = (
                "missing outcome_record_id: run is incomplete under "
                "the verdict contract"
            )


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
