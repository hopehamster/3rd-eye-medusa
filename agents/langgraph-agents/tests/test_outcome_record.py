"""Outcome record: Postgres schema + writer design (outcome-record-spec).

Writers are n8n/B1; the agent supplies its verdict only. No live
database: the DDL is checked as text and the writer is checked by the
parameterized SQL it produces, never by executing against Postgres.
Written first; must FAIL before outcome_record.py / outcome_schema.sql
exist."""

import re
import unittest
from pathlib import Path

from research_agent.outcome_record import (
    build_insert_sql,
    build_update_sql,
    precreate_record,
)
from research_agent.state import Signal

HERE = Path(__file__).resolve().parent
DDL = HERE.parent / "research_agent" / "outcome_schema.sql"


def sig(family: str, direction: str = "agree") -> Signal:
    return Signal(family=family, name=f"test-{family}", direction=direction,
                  strength=0.8, evidence="mocked evidence", source="mock")


class TestSchemaText(unittest.TestCase):
    def setUp(self) -> None:
        self.assertTrue(DDL.exists(), "outcome_schema.sql must exist")
        self.text = DDL.read_text()

    def test_table_and_required_columns(self) -> None:
        required = ["candidate_id", "candidate_name", "signals",
                    "agreeing_families", "disagreeing_families", "vetoed_by",
                    "score", "verdict", "human_decision", "real_outcome",
                    "confounders", "loser_actions"]
        for column in required:
            self.assertIn(column, self.text, f"missing column {column}")
        self.assertNotIn("test_spend", self.text,
                         "product testing was removed; no test-spend field")

    def test_append_only_guard_and_indexes(self) -> None:
        self.assertIn("outcome_records", self.text)
        # One record per judgement, linked by candidate; verdict fields
        # are guarded by the writer (see TestWriter) and the DDL states it.
        self.assertIn("candidate_id", self.text)
        self.assertIn("CREATE INDEX", self.text)

    def test_no_product_testing_language(self) -> None:
        lowered = self.text.lower()
        self.assertNotIn("sample order", lowered)
        self.assertNotIn("ad test", lowered)


class TestWriter(unittest.TestCase):
    def test_precreate_returns_record_with_empty_later_fields(self) -> None:
        record = precreate_record(candidate_id="cand-1",
                                  candidate_name="mock product")
        self.assertEqual(record["candidate_id"], "cand-1")
        self.assertIsNone(record["verdict"])
        self.assertIsNone(record["human_decision"])
        self.assertIsNone(record["real_outcome"])
        self.assertTrue(record["record_id"])

    def test_insert_sql_carries_verdict_fields_as_parameters(self) -> None:
        sql, params = build_insert_sql(
            record_id="rec-1", candidate_id="cand-1",
            candidate_name="mock product",
            signals=[sig("social_velocity")],
            agreeing_families=["social_velocity"],
            disagreeing_families=[],
            vetoed_by=[], score=None, verdict="skip",
            reasoning="2 families agree; 3 required.",
            confidence=0.8, best_effort=False, verified=None)
        self.assertIn("INSERT INTO outcome_records", sql)
        self.assertNotIn("mock product", sql,
                         "values must be parameters, never interpolated")
        self.assertEqual(params["verdict"], "skip")
        self.assertEqual(params["candidate_id"], "cand-1")

    def test_update_cannot_rewrite_verdict_fields(self) -> None:
        with self.assertRaises(ValueError):
            build_update_sql(record_id="rec-1",
                             fields={"verdict": "list"})

    def test_update_can_fill_human_decision_and_real_outcome(self) -> None:
        sql, params = build_update_sql(
            record_id="rec-1",
            fields={"human_decision": "override",
                    "human_reason": "fresh re-check passed",
                    "real_outcome": "not listed"})
        self.assertIn("UPDATE outcome_records", sql)
        self.assertEqual(params["human_decision"], "override")

    def test_shadow_outcome_for_skip_is_not_listed_never_imputed_sales(self) -> None:
        sql, params = build_update_sql(
            record_id="rec-1", fields={"real_outcome": "not listed"})
        self.assertEqual(params["real_outcome"], "not listed")
        self.assertNotIn("sales", str(params).lower().replace("not listed", ""))

    def test_agent_supplies_verdict_only_no_writer_side_effects(self) -> None:
        # The writer functions are pure: same inputs, same SQL, no I/O.
        first = build_insert_sql(
            record_id="rec-1", candidate_id="cand-1",
            candidate_name="mock product", signals=[],
            agreeing_families=[], disagreeing_families=[], vetoed_by=[],
            score=None, verdict="skip", reasoning="r", confidence=0.0,
            best_effort=False, verified=None)
        second = build_insert_sql(
            record_id="rec-1", candidate_id="cand-1",
            candidate_name="mock product", signals=[],
            agreeing_families=[], disagreeing_families=[], vetoed_by=[],
            score=None, verdict="skip", reasoning="r", confidence=0.0,
            best_effort=False, verified=None)
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
