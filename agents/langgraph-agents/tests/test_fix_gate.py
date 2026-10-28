"""Fix tests for the 2026-10-27 code/security review blocks (gate).

Written first; must FAIL against the pre-fix gate. Stdlib unittest
only: no live services, no network, no catalog.

Covered: Security M1 (flag False must refuse), Security M3 / Code
Review M3 (kind review refused; non-veto LIST needs approver +
reason), Security M2 (bare-name override refused; verified-id
override passes only with a supplied Michael mapping), Security M4
(bare-boolean re-check refused; structured re-check reference
required), Code Review M4 (verdict tiers red, override decision
item tiers amber, as separate items), Security W4 (verdict with no
outcome record id is marked incomplete on the Verdict itself),
green-audit revert on audit error.
"""

import unittest

from research_agent.approval import (
    Approval,
    RecheckReference,
    authorize_catalog_write,
    authorize_state_change,
    green_audit_mode,
    override_queue_tier,
    queue_tier,
)
from research_agent.rules import decide_verdict
from research_agent.state import Signal, Verdict

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


def good_recheck() -> RecheckReference:
    return RecheckReference(record_id="recheck-9",
                            checked_at="2026-10-27T12:00:00+00:00",
                            passed=True)


def verified_michael_override() -> Approval:
    return Approval(verdict_id="rec-2", approver="Michael",
                    kind="override", reason="fresh re-check: supplier live",
                    verified_approver_id=MICHAEL_ID,
                    recheck_reference=good_recheck())


class TestFlagMustNotBypass(unittest.TestCase):
    def test_list_with_flag_false_and_no_approval_is_refused(self) -> None:
        verdict = list_verdict()
        verdict.requires_human_approval = False
        allowed, reason = authorize_catalog_write(verdict, approvals=[])
        self.assertFalse(allowed)
        self.assertNotIn("allowed: human approval", reason)

    def test_list_with_flag_false_and_approval_passes(self) -> None:
        verdict = list_verdict()
        verdict.requires_human_approval = False
        approval = Approval(verdict_id="rec-1", approver="reviewer",
                            kind="approve", reason="checked margin math")
        allowed, _ = authorize_catalog_write(verdict, [approval])
        self.assertTrue(allowed)


class TestNonVetoListKindAndReason(unittest.TestCase):
    def test_kind_review_is_refused_for_list(self) -> None:
        approval = Approval(verdict_id="rec-1", approver="reviewer",
                            kind="review", reason="looked it over")
        allowed, _ = authorize_catalog_write(list_verdict(), [approval])
        self.assertFalse(allowed)

    def test_empty_approver_is_refused_for_list(self) -> None:
        approval = Approval(verdict_id="rec-1", approver="   ",
                            kind="approve", reason="checked")
        allowed, _ = authorize_catalog_write(list_verdict(), [approval])
        self.assertFalse(allowed)

    def test_empty_reason_is_refused_for_list(self) -> None:
        approval = Approval(verdict_id="rec-1", approver="reviewer",
                            kind="approve", reason="   ")
        allowed, _ = authorize_catalog_write(list_verdict(), [approval])
        self.assertFalse(allowed)


class TestStateChangeKindAndReason(unittest.TestCase):
    def test_state_change_kind_review_refused(self) -> None:
        approval = Approval(verdict_id="order-9", approver="reviewer",
                            kind="review", reason="looked it over")
        allowed, _ = authorize_state_change("order-9", [approval])
        self.assertFalse(allowed)

    def test_state_change_empty_approver_or_reason_refused(self) -> None:
        for approver, reason in [("   ", "ok"), ("reviewer", "   ")]:
            approval = Approval(verdict_id="order-9", approver=approver,
                                kind="approve", reason=reason)
            allowed, _ = authorize_state_change("order-9", [approval])
            self.assertFalse(allowed)


class TestMichaelOverrideIdentity(unittest.TestCase):
    def test_bare_name_override_is_refused(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="Michael",
                            kind="override", reason="fresh re-check passed",
                            fresh_recheck_passed=True)
        allowed, _ = authorize_catalog_write(
            veto_verdict(), [approval],
            michael_verified_ids=frozenset({MICHAEL_ID}))
        self.assertFalse(allowed)

    def test_verified_id_not_in_michael_mapping_is_refused(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="Michael",
                            kind="override", reason="fresh re-check passed",
                            verified_approver_id="someone-else",
                            recheck_reference=good_recheck())
        allowed, _ = authorize_catalog_write(
            veto_verdict(), [approval],
            michael_verified_ids=frozenset({MICHAEL_ID}))
        self.assertFalse(allowed)

    def test_override_without_supplied_mapping_is_refused(self) -> None:
        # Fail closed: without the wiring leg's Michael mapping, no
        # override can pass, even with a verified-looking id.
        allowed, _ = authorize_catalog_write(
            veto_verdict(), [verified_michael_override()])
        self.assertFalse(allowed)

    def test_verified_michael_override_passes_with_mapping(self) -> None:
        allowed, _ = authorize_catalog_write(
            veto_verdict(), [verified_michael_override()],
            michael_verified_ids=frozenset({MICHAEL_ID}))
        self.assertTrue(allowed)


class TestRecheckReference(unittest.TestCase):
    def test_bare_boolean_recheck_is_refused(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="Michael",
                            kind="override", reason="fresh re-check passed",
                            verified_approver_id=MICHAEL_ID,
                            fresh_recheck_passed=True)
        allowed, _ = authorize_catalog_write(
            veto_verdict(), [approval],
            michael_verified_ids=frozenset({MICHAEL_ID}))
        self.assertFalse(allowed)

    def test_recheck_reference_missing_record_or_timestamp_refused(self) -> None:
        for ref in [RecheckReference(record_id="", checked_at="2026-10-27T12:00:00+00:00", passed=True),
                    RecheckReference(record_id="recheck-9", checked_at="", passed=True),
                    RecheckReference(record_id="recheck-9", checked_at="not-a-time", passed=True),
                    RecheckReference(record_id="recheck-9", checked_at="2026-10-27T12:00:00+00:00", passed=False)]:
            approval = Approval(verdict_id="rec-2", approver="Michael",
                                kind="override", reason="fresh re-check",
                                verified_approver_id=MICHAEL_ID,
                                recheck_reference=ref)
            allowed, _ = authorize_catalog_write(
                veto_verdict(), [approval],
                michael_verified_ids=frozenset({MICHAEL_ID}))
            self.assertFalse(allowed, f"reference should be refused: {ref!r}")


class TestQueueTierAgreement(unittest.TestCase):
    def test_veto_verdict_tiers_red_and_override_item_tiers_amber(self) -> None:
        verdict = veto_verdict()
        self.assertEqual(queue_tier(verdict), "red")
        self.assertEqual(override_queue_tier(verdict), "amber")

    def test_list_still_tiers_amber(self) -> None:
        self.assertEqual(queue_tier(list_verdict()), "amber")


class TestIncompleteVerdictMarker(unittest.TestCase):
    def test_verdict_without_record_id_is_marked_incomplete(self) -> None:
        verdict = decide_verdict([sig("social_velocity")])
        self.assertIsNone(verdict.outcome_record_id)
        self.assertTrue(verdict.incomplete)
        self.assertTrue(verdict.incomplete_reason)

    def test_verdict_with_record_id_is_not_incomplete(self) -> None:
        self.assertFalse(list_verdict().incomplete)

    def test_gate_refuses_verdict_without_record_id(self) -> None:
        verdict = Verdict(product="x", decision="list",
                          agreeing_families=["social_velocity"],
                          reasoning="r", confidence=0.8)
        approval = Approval(verdict_id="rec-1", approver="reviewer",
                            kind="approve", reason="checked")
        allowed, reason = authorize_catalog_write(verdict, [approval])
        self.assertFalse(allowed)
        self.assertIn("incomplete", reason)


class TestGreenAuditRevert(unittest.TestCase):
    def test_audit_error_reverts_sampled_to_full(self) -> None:
        self.assertEqual(green_audit_mode(proven=True, audit_error=True), "full")
        self.assertEqual(green_audit_mode(proven=True), "sampled")
        self.assertEqual(green_audit_mode(proven=False), "full")


if __name__ == "__main__":
    unittest.main()
