"""B2-8 approval check in code (not paper-only).

The verdict field requires_human_approval is a claim; this module is
the check. Before any catalog write, order write, or other
state-changing action driven by a verdict, wired code calls
authorize_* here. If the check finds no matching human approval, the
action is REFUSED and nothing is written. Both directions are tested:
refusal without approval and passage with approval (see
tests/test_approval.py).

Gate rules (fixed 2026-10-27 against the code/security review
blocks; Michael 2026-10-27, comment 6460788465):

- The gate NEVER trusts the verdict's own requires_human_approval
  flag. Every LIST write requires a matching approval regardless of
  that flag; flag False with no approval is refused, and no reason
  string claims an approval that does not exist.
- A non-veto LIST passes only on a matching record with
  kind="approve", a non-empty approver, and a non-empty reason. A
  kind="review" record is a review, not an approval, and is refused.
  The same kind/approver/reason rule applies to authorize_state_change.
- Veto / override handling:
  - An agent SKIP over a veto is NEVER converted into a LIST by code.
    A human override LIST is a separate recorded human decision taken
    through the amber queue with the full veto card — the same single
    approval mechanism as every other override, not a path outside it.
  - Override authority is Michael ONLY, proven by authenticated
    identity, never by a free-text name. An Approval passes the
    override path only when its verified_approver_id — set by the
    wiring leg ONLY from an authenticated session — is in the
    michael_verified_ids set the wiring leg supplies (the ids its
    identity store maps to Michael). A bare approver name of
    "michael" with no verified id, a verified id outside the
    mapping, or no mapping supplied at all is refused (fail closed).
    No auth system is invented here: the wiring leg owns the
    authenticated session and the id-to-Michael mapping, and must
    never derive verified_approver_id from the approver name string.
  - An override must carry a structured re-check reference
    (RecheckReference: re-run record id + timestamp + passed), and
    the gate validates it structurally (non-empty record id, passed,
    parseable timestamp, not in the future). The legacy
    fresh_recheck_passed boolean is IGNORED by the gate: a bare
    boolean, however True, never passes an override. The wiring leg
    must additionally verify, before minting an Approval, that the
    referenced record exists, that its re-run signals passed, and
    that it is fresh under the owner-set freshness rule — the gate's
    structural check is the floor, not that verification. No
    freshness window number is set here.
  - Approvals match a SPECIFIC verdict/action id (the outcome record
    id for verdicts), never "a human approved something recently" and
    never a product name.

Queue tiers (same decisions):
- Red (hard block): a vetoed candidate, a critical-check failure, or
  an unresolved verification. Never enters the queue as an approvable
  item in the red tier; the only path past a veto is the amber
  override below.
- Amber (async human queue): every LIST verdict, every override,
  every weak/shaky critical disagreement (escalated to Michael, not
  an automatic no), every delist recommendation, every money
  recommendation.
- Green (auto-approved low-risk only): routine SKIPs — no veto, no
  critical failure, no weak critical disagreement. Green NEVER covers
  a LIST, a catalog write, a money action, or a delist.
- Tier agreement (Code Review M4): queue_tier() tiers the VERDICT
  (a vetoed verdict tiers red). The override DECISION is a separate
  queue item and tiers amber via override_queue_tier(). The two
  functions must not be conflated: red verdict, amber override item.

Green audit (same corrections): green-tier routine decisions are
reviewed at 100% at first; only once the audit process is proven
does review drop to a sample. No sample percentage is set here —
the rate after proving is an owner-set value, not a field standard
and not a number this module invents. Proven criteria, owner
sign-off, and the revert rule are defined in the research spec and
must exist before sampled mode is used; an audit error reverts
green to full review (see green_audit_mode's audit_error input).

Wiring-leg requirements (Security W1/W3/W4 — documented here, NOT
claimed as protected): no production call site exists in team-work
(the gate is called only in tests), so nothing is "protected" yet.
Before any live write relies on this gate, the wiring leg must call
the gate before every catalog/order/money write and fail closed on
refusal; define green-audit proven criteria + owner sign-off before
sampled mode is used; and surface incomplete verdicts (Verdict
flag + graph errors entry) rather than letting them sit silently
in a queue.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

from research_agent.state import Verdict


@dataclass
class RecheckReference:
    """Reference to a fresh supplier/margin re-check re-run.

    record_id is the re-run signals/record id, checked_at is its
    ISO-8601 timestamp, passed is whether the re-run passed. This is
    a reference the wiring leg verified against a real re-run, not a
    self-asserted boolean.
    """

    record_id: str
    checked_at: str
    passed: bool

    def is_valid(self) -> bool:
        """Structural validity only: id, passed, parseable, not future.

        Freshness against the actual re-run record (existence, passing
        signals, owner-set freshness window) is the wiring leg's check
        before minting the Approval; this method is the gate floor.
        """
        if not self.record_id or not self.record_id.strip():
            return False
        if self.passed is not True:
            return False
        if not self.checked_at or not self.checked_at.strip():
            return False
        try:
            checked = datetime.fromisoformat(self.checked_at.strip())
        except ValueError:
            return False
        if checked.tzinfo is None:
            checked = checked.replace(tzinfo=timezone.utc)
        return checked <= datetime.now(timezone.utc)


@dataclass
class Approval:
    """One recorded human decision, matched to one verdict/action id."""

    verdict_id: str  # outcome_record_id for verdicts, action id otherwise
    approver: str
    kind: str  # "approve" | "override" | "review"
    reason: str = ""
    # LEGACY, IGNORED by the gate: a bare self-asserted boolean must
    # never pass an override. Kept only so old records still parse;
    # override passage requires recheck_reference below.
    fresh_recheck_passed: bool | None = None
    # Authenticated-identity proof, set ONLY by the wiring leg from
    # an authenticated session. Never derived from the approver name.
    # None means no identity proof, and an override with None is
    # refused.
    verified_approver_id: str | None = None
    # For a veto override: the verified fresh re-check reference.
    recheck_reference: RecheckReference | None = None


def _verdict_key(verdict: Verdict) -> str | None:
    return verdict.outcome_record_id


def _qualifying_approval(
    verdict: Verdict, approvals: list[Approval], *, key: str
) -> bool:
    """A matching kind=approve record with approver and reason."""
    return any(
        a.verdict_id == key
        and a.kind == "approve"
        and a.approver.strip()
        and a.reason.strip()
        for a in approvals
    )


def queue_tier(verdict: Verdict) -> str:
    """Route one verdict: "red" | "amber" | "green".

    This tiers the verdict itself. A vetoed verdict tiers red even
    though its override decision item tiers amber (see
    override_queue_tier).
    """
    if verdict.vetoed_by:
        return "red"
    if verdict.decision == "list":
        return "amber"
    # A SKIP carrying a weak/shaky critical disagreement is not a
    # routine SKIP: it escalates to Michael, so it is amber.
    critical_disagree = {
        f for f in verdict.disagreeing_families
        if f in ("supplier_proof", "margin_math")
    }
    if critical_disagree:
        return "amber"
    return "green"


def override_queue_tier(verdict: Verdict) -> str:
    """Tier of the separate override-decision queue item: "amber".

    Every human override decision (of a veto or of a SKIP) is taken
    through the amber queue with the full veto card. This does not
    change queue_tier(verdict): the verdict itself still tiers red
    when vetoed. The argument is accepted for call-site symmetry;
    the override item's tier is amber by rule, not by verdict shape.
    """
    return "amber"


def green_audit_mode(*, proven: bool, audit_error: bool = False) -> str:
    """Audit coverage for green-tier routine decisions.

    "full" = 100% reviewed at first. "sampled" = a sample reviewed,
    only once the audit process is proven. The sample rate itself is
    deliberately not a number in this module. An audit error reverts
    green to full review until the cause is fixed, even if proven
    was previously asserted.
    """
    if audit_error:
        return "full"
    return "sampled" if proven else "full"


def authorize_catalog_write(
    verdict: Verdict, approvals: list[Approval],
    *, michael_verified_ids: frozenset[str] | set[str] | None = None,
) -> tuple[bool, str]:
    """Allow a catalog write driven by this verdict, or refuse it.

    Returns (allowed, reason). Refusals log nothing secret; the reason
    names which condition failed so the caller can record it. The
    verdict's requires_human_approval flag is deliberately NOT
    consulted: every LIST write requires a matching approval
    regardless of the flag.

    michael_verified_ids is the wiring leg's set of verified
    approver ids mapped to Michael in its identity store. If it is
    None (no mapping supplied), no veto override can pass.
    """
    key = _verdict_key(verdict)
    if key is None:
        return False, ("refused: verdict has no outcome record id; "
                       "run is incomplete")
    # Veto override is checked BEFORE the SKIP refusal: a valid
    # Michael override is the one path that permits a write despite
    # the agent verdict being SKIP. Any other SKIP is refused below.
    if verdict.vetoed_by:
        overrides = [a for a in approvals
                     if a.verdict_id == key and a.kind == "override"]
        if not overrides:
            return False, "refused: vetoed candidate needs a Michael override, not an approval"
        for override in overrides:
            if not override.reason.strip():
                continue
            verified = override.verified_approver_id
            if not verified or not verified.strip():
                continue
            if michael_verified_ids is None or verified not in michael_verified_ids:
                continue
            reference = override.recheck_reference
            if reference is None or not reference.is_valid():
                continue
            return True, ("allowed: Michael override with verified "
                          "identity and valid re-check reference")
        return False, ("refused: veto override must be Michael-only via a "
                       "verified approver id, with a valid re-check "
                       "reference and a reason")
    if verdict.decision != "list":
        return False, "refused: agent verdict is not LIST; code never converts a SKIP into a LIST"
    if _qualifying_approval(verdict, approvals, key=key):
        return True, "allowed: human approval for this LIST verdict"
    return False, ("refused: no human approval for this LIST verdict "
                   "(a qualifying record requires kind approve, "
                   "non-empty approver, and non-empty reason)")


def authorize_state_change(
    action_id: str, approvals: list[Approval]
) -> tuple[bool, str]:
    """Oracle-path shape: no state-changing action without a human gate.

    The Oracle agent is read-only, so this binds any future action
    surface before its first use: an action id with no matching
    recorded approval is refused. Only kind="approve" with a
    non-empty approver and reason passes; a review record does not.
    """
    matching = [a for a in approvals if a.verdict_id == action_id]
    if not matching:
        return False, "refused: no human approval for this action"
    if any(a.kind == "approve" and a.approver.strip() and a.reason.strip()
           for a in matching):
        return True, "allowed: human approval for this action"
    return False, ("refused: no qualifying human approval for this action "
                   "(kind approve, non-empty approver, and non-empty "
                   "reason required)")


def authorize_dev_change(
    *, reviewed_by: str | None, reason: str | None
) -> tuple[bool, str]:
    """Dev-path shape (#124): no merge/deploy without recorded human review."""
    if not reviewed_by or not reviewed_by.strip():
        return False, "refused: no recorded human review"
    if not reason or not reason.strip():
        return False, "refused: human review recorded without a reason"
    return True, "allowed: recorded human review"
