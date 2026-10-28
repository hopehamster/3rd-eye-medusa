"""B2-8 through the B1 wiring leg: refusal AND passage, veto/override.

No live services: the gate is pure code over verdict objects built
from the canonical research_agent module (same logic the B2 suite
tests, reached here through the B1 adapter)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".." / "b2-agent"))

from app.approval_gate import Approval, RecheckReference, authorize_catalog_write
from research_agent.rules import decide_verdict
from research_agent.state import Signal


def sig(family: str, direction: str = "agree") -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=0.8, evidence="mocked evidence", source="mock")


def list_verdict():
    return decide_verdict([sig("social_velocity"), sig("search_demand"),
                           sig("supplier_proof")], outcome_record_id="rec-1")


def veto_verdict():
    return decide_verdict([sig("social_velocity"), sig("search_demand"),
                           sig("ad_longevity"),
                           sig("supplier_proof", direction="disagree")],
                          outcome_record_id="rec-2")


def test_refusal_without_approval():
    allowed, _ = authorize_catalog_write(list_verdict(), approvals=[])
    assert not allowed


def test_passage_with_matching_approval():
    approval = Approval(verdict_id="rec-1", approver="reviewer",
                        kind="approve", reason="checked")
    allowed, _ = authorize_catalog_write(list_verdict(), [approval])
    assert allowed


def test_veto_override_michael_only_with_fresh_recheck():
    # Fixed 2026-10-27: bare name + bare boolean no longer passes.
    # An override needs a verified approver id in the wiring leg's
    # Michael mapping plus a valid re-check reference.
    good = Approval(verdict_id="rec-2", approver="Michael",
                    kind="override", reason="fresh re-check passed",
                    verified_approver_id="verified-user-michael-001",
                    recheck_reference=RecheckReference(
                        record_id="recheck-9",
                        checked_at="2026-10-27T12:00:00+00:00",
                        passed=True))
    allowed, _ = authorize_catalog_write(
        veto_verdict(), [good],
        michael_verified_ids=frozenset({"verified-user-michael-001"}))
    assert allowed
    bad = Approval(verdict_id="rec-2", approver="reviewer",
                   kind="override", reason="fresh re-check passed",
                   fresh_recheck_passed=True)
    allowed, _ = authorize_catalog_write(
        veto_verdict(), [bad],
        michael_verified_ids=frozenset({"verified-user-michael-001"}))
    assert not allowed
