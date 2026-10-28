"""B2-8 approval check in code: refusal test AND passage test, with
veto/override handling (Michael 2026-10-27, comment 6460788465:
override is Michael-only, with a fresh supplier/margin re-check).

Written first; must FAIL before research_agent/approval.py exists.
Stdlib unittest only: no live services, no network, no catalog."""

import unittest

from research_agent.approval import (
    Approval,
    RecheckReference,
    authorize_catalog_write,
    authorize_dev_change,
    authorize_state_change,
    green_audit_mode,
    queue_tier,
)
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


def routine_skip_verdict():
    return decide_verdict([sig("social_velocity")])


class TestQueueTiers(unittest.TestCase):
    def test_every_list_goes_to_human_queue(self) -> None:
        self.assertEqual(queue_tier(list_verdict()), "amber")

    def test_veto_skip_is_red_not_green(self) -> None:
        self.assertEqual(queue_tier(veto_verdict()), "red")

    def test_routine_skip_is_green_only(self) -> None:
        self.assertEqual(queue_tier(routine_skip_verdict()), "green")

    def test_weak_critical_skip_escalates_to_amber(self) -> None:
        verdict = decide_verdict(
            [sig("social_velocity"), sig("search_demand"),
             sig("supplier_proof", direction="disagree")],
            weak_critical_families=("supplier_proof",))
        # Count fails too, but the weak critical disagreement must route
        # the item to a human, not to the green routine bucket.
        self.assertEqual(queue_tier(verdict), "amber")

    def test_green_audit_starts_at_full_then_sampled_once_proven(self) -> None:
        self.assertEqual(green_audit_mode(proven=False), "full")
        self.assertEqual(green_audit_mode(proven=True), "sampled")


class TestCatalogWriteGate(unittest.TestCase):
    def test_refusal_without_approval(self) -> None:
        allowed, reason = authorize_catalog_write(list_verdict(), approvals=[])
        self.assertFalse(allowed)
        self.assertIn("no human approval", reason)

    def test_passage_with_approval_for_that_verdict(self) -> None:
        approval = Approval(verdict_id="rec-1", approver="reviewer",
                            kind="approve", reason="checked margin math")
        allowed, _ = authorize_catalog_write(list_verdict(), [approval])
        self.assertTrue(allowed)

    def test_approval_for_a_different_verdict_does_not_pass(self) -> None:
        approval = Approval(verdict_id="rec-other", approver="reviewer",
                            kind="approve", reason="checked")
        allowed, _ = authorize_catalog_write(list_verdict(), [approval])
        self.assertFalse(allowed)

    def test_skip_verdict_never_converts_to_catalog_write(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="michael",
                            kind="approve", reason="approve anyway")
        allowed, _ = authorize_catalog_write(veto_verdict(), [approval])
        self.assertFalse(allowed)

    def test_ordinary_approval_over_veto_is_refused(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="michael",
                            kind="approve", reason="looks fine",
                            fresh_recheck_passed=True)
        allowed, _ = authorize_catalog_write(veto_verdict(), [approval])
        self.assertFalse(allowed)

    def test_michael_override_without_fresh_recheck_is_refused(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="Michael",
                            kind="override", reason="supplier confirmed live")
        allowed, _ = authorize_catalog_write(veto_verdict(), [approval])
        self.assertFalse(allowed)

    def test_michael_override_with_fresh_recheck_passes(self) -> None:
        # Fixed 2026-10-27: a bare name + bare boolean no longer
        # passes. An override needs a verified approver id in the
        # wiring leg's Michael mapping plus a valid re-check
        # reference.
        approval = Approval(verdict_id="rec-2", approver="Michael",
                            kind="override", reason="fresh re-check: supplier "
                            "live, margin recomputed and passing",
                            verified_approver_id="verified-user-michael-001",
                            recheck_reference=RecheckReference(
                                record_id="recheck-9",
                                checked_at="2026-10-27T12:00:00+00:00",
                                passed=True))
        allowed, _ = authorize_catalog_write(
            veto_verdict(), [approval],
            michael_verified_ids=frozenset({"verified-user-michael-001"}))
        self.assertTrue(allowed)

    def test_non_michael_override_is_refused_even_with_recheck(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="reviewer",
                            kind="override", reason="fresh re-check passed",
                            fresh_recheck_passed=True)
        allowed, _ = authorize_catalog_write(veto_verdict(), [approval])
        self.assertFalse(allowed)

    def test_override_without_reason_is_refused(self) -> None:
        approval = Approval(verdict_id="rec-2", approver="Michael",
                            kind="override", reason="",
                            fresh_recheck_passed=True)
        allowed, _ = authorize_catalog_write(veto_verdict(), [approval])
        self.assertFalse(allowed)


class TestOtherSurfaces(unittest.TestCase):
    def test_dev_change_refused_without_human_review(self) -> None:
        allowed, _ = authorize_dev_change(reviewed_by=None, reason=None)
        self.assertFalse(allowed)

    def test_dev_change_passes_with_recorded_human_review(self) -> None:
        allowed, _ = authorize_dev_change(reviewed_by="michael",
                                          reason="reviewed diff and tests")
        self.assertTrue(allowed)

    def test_oracle_state_change_refused_without_approval(self) -> None:
        allowed, _ = authorize_state_change(action_id="order-9", approvals=[])
        self.assertFalse(allowed)

    def test_oracle_state_change_passes_with_matching_approval(self) -> None:
        approval = Approval(verdict_id="order-9", approver="reviewer",
                            kind="approve", reason="customer confirmed")
        allowed, _ = authorize_state_change("order-9", [approval])
        self.assertTrue(allowed)


if __name__ == "__main__":
    unittest.main()
