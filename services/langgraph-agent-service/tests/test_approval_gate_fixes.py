"""Gate fixes through the B1 wiring leg (same canonical gate as B2).

Written first; must FAIL against the pre-fix gate. Covers, through
the adapter: flag-False refusal, kind-review refusal, bare-name
override refusal, verified-id override passage with mapping, and
the red-verdict / amber-override-item tier split.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".." / "b2-agent"))

from app.approval_gate import (  # noqa: E402
    Approval,
    RecheckReference,
    authorize_catalog_write,
    override_queue_tier,
    queue_tier,
)
from research_agent.rules import decide_verdict  # noqa: E402
from research_agent.state import Signal  # noqa: E402

MICHAEL_ID = "verified-user-michael-001"


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


def test_flag_false_with_no_approval_refused():
    verdict = list_verdict()
    verdict.requires_human_approval = False
    allowed, reason = authorize_catalog_write(verdict, approvals=[])
    assert not allowed
    assert "allowed: human approval" not in reason


def test_kind_review_refused_for_list():
    approval = Approval(verdict_id="rec-1", approver="reviewer",
                        kind="review", reason="looked it over")
    allowed, _ = authorize_catalog_write(list_verdict(), [approval])
    assert not allowed


def test_bare_name_override_refused():
    approval = Approval(verdict_id="rec-2", approver="Michael",
                        kind="override", reason="fresh re-check passed",
                        fresh_recheck_passed=True)
    allowed, _ = authorize_catalog_write(
        veto_verdict(), [approval],
        michael_verified_ids=frozenset({MICHAEL_ID}))
    assert not allowed


def test_verified_override_passes_with_mapping_and_recheck():
    approval = Approval(verdict_id="rec-2", approver="Michael",
                        kind="override", reason="fresh re-check passed",
                        verified_approver_id=MICHAEL_ID,
                        recheck_reference=RecheckReference(
                            record_id="recheck-9",
                            checked_at="2026-10-27T12:00:00+00:00",
                            passed=True))
    allowed, _ = authorize_catalog_write(
        veto_verdict(), [approval],
        michael_verified_ids=frozenset({MICHAEL_ID}))
    assert allowed


def test_veto_verdict_red_override_item_amber():
    verdict = veto_verdict()
    assert queue_tier(verdict) == "red"
    assert override_queue_tier(verdict) == "amber"
