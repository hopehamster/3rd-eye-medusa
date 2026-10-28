"""Fix tests for outcome-record blocks (Code Review M5/M6, Security M5,
regression guard on the UPDATE allowlist order).

Written first; must FAIL against the pre-fix writer/schema/rules.
Stdlib unittest only: no live database — the writer is checked by
the SQL it produces, never by executing against Postgres.
"""

import unittest
from pathlib import Path

from research_agent.outcome_record import (
    build_insert_sql,
    build_update_sql,
    build_verdict_fill_sql,
    precreate_record,
)
from research_agent.rules import decide_verdict
from research_agent.state import Signal

HERE = Path(__file__).resolve().parent
DDL = HERE.parent / "research_agent" / "outcome_schema.sql"


def sig(family: str, direction: str = "agree") -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=0.8, evidence="mocked evidence", source="mock")


class TestWeakFamiliesPersisted(unittest.TestCase):
    def test_verdict_carries_weak_critical_families(self) -> None:
        verdict = decide_verdict(
            [sig("social_velocity"), sig("search_demand"),
             sig("supplier_proof", direction="disagree")],
            weak_critical_families=("supplier_proof",))
        self.assertEqual(verdict.weak_critical_families, ["supplier_proof"])

    def test_schema_has_weak_and_prior_columns(self) -> None:
        text = DDL.read_text()
        self.assertIn("weak_critical_families", text)
        self.assertIn("prior_record_id", text)

    def test_insert_carries_weak_and_prior(self) -> None:
        sql, params = build_insert_sql(
            record_id="rec-1", candidate_id="cand-1",
            candidate_name="mock product", signals=[sig("social_velocity")],
            agreeing_families=["social_velocity"],
            disagreeing_families=["supplier_proof"], vetoed_by=[],
            score=None, verdict="skip", reasoning="r", confidence=0.8,
            best_effort=False, verified=None,
            weak_critical_families=["supplier_proof"],
            prior_record_id="rec-0")
        self.assertIn("weak_critical_families", sql)
        self.assertIn("prior_record_id", sql)
        self.assertEqual(params["weak_critical_families"], ["supplier_proof"])
        self.assertEqual(params["prior_record_id"], "rec-0")

    def test_precreate_has_weak_and_prior_slots(self) -> None:
        record = precreate_record(candidate_id="cand-1",
                                  candidate_name="mock product")
        self.assertIn("weak_critical_families", record)
        self.assertIn("prior_record_id", record)
        self.assertIsNone(record["weak_critical_families"])
        self.assertIsNone(record["prior_record_id"])


class TestRejudgementLinksPrior(unittest.TestCase):
    def test_rejudgement_verdict_links_prior_vetoed_record(self) -> None:
        verdict = decide_verdict(
            [sig("social_velocity"), sig("search_demand"),
             sig("supplier_proof")],
            outcome_record_id="rec-2", prior_record_id="rec-1")
        self.assertEqual(verdict.prior_record_id, "rec-1")
        self.assertEqual(verdict.outcome_record_id, "rec-2")
        # Corrected signals are retained on the new verdict, not
        # merged into the prior record: supplier now agrees here.
        self.assertIn("supplier_proof", verdict.agreeing_families)


class TestVerdictFillPath(unittest.TestCase):
    def test_fill_sql_sets_verdict_fields_once(self) -> None:
        sql, params = build_verdict_fill_sql(
            record_id="rec-1", signals=[sig("social_velocity")],
            agreeing_families=["social_velocity"],
            disagreeing_families=[], vetoed_by=[], score=None,
            verdict="skip", reasoning="r", confidence=0.8,
            best_effort=False, verified=None)
        self.assertIn("UPDATE outcome_records", sql)
        self.assertIn("verdict = %(verdict)s", sql)
        # One-time fill: the row is filled only while its verdict
        # fields are still NULL, so a second fill matches no row.
        self.assertIn("verdict IS NULL", sql)
        self.assertEqual(params["verdict"], "skip")
        self.assertEqual(params["record_id"], "rec-1")

    def test_fill_sql_refuses_later_fields(self) -> None:
        # A fill is for verdict fields only; human decision and
        # outcome still go through build_update_sql.
        with self.assertRaises(TypeError):
            build_verdict_fill_sql(  # type: ignore[call-arg]
                record_id="rec-1", signals=[], agreeing_families=[],
                disagreeing_families=[], vetoed_by=[], score=None,
                verdict="skip", reasoning="r", confidence=0.8,
                best_effort=False, verified=None,
                human_decision="approve")


class TestUpdateAllowlistOrderRegression(unittest.TestCase):
    def test_allowlist_checked_before_interpolation(self) -> None:
        # Regression guard: safety rests entirely on the allowlist
        # check running BEFORE any field name is interpolated into
        # SQL. Injection-style names must raise, never reach SQL.
        malicious = [
            "human_decision = 'x'; DROP TABLE outcome_records; --",
            "verdict",
            "record_id",
            "human_decision, real_outcome = 'x' --",
        ]
        for name in malicious:
            with self.assertRaises(ValueError, msg=f"field {name!r}"):
                build_update_sql(record_id="rec-1", fields={name: "x"})

    def test_valid_update_still_interpolates_only_allowlisted_names(self) -> None:
        sql, params = build_update_sql(
            record_id="rec-1",
            fields={"human_decision": "approve", "human_reason": "checked"})
        self.assertIn("human_decision = %(human_decision)s", sql)
        self.assertIn("human_reason = %(human_reason)s", sql)
        self.assertEqual(params["record_id"], "rec-1")


if __name__ == "__main__":
    unittest.main()
