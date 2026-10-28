"""Fix tests for spec wording (Code Review M1/M2/M4, Security W1/W3/W4).

Written first; must FAIL against the pre-fix specs. These read spec
text only — no code behavior, no live services.
"""

import re
import unittest
from pathlib import Path

TEAM_WORK = Path(__file__).resolve().parents[2]
RESEARCH = TEAM_WORK / "b2-agent" / "research-deep-agent-spec.md"


def flat(text: str) -> str:
    """Collapse line wraps so wrapped spec phrases match as written."""
    return re.sub(r"\s+", " ", text)
OUTCOME_SPEC = TEAM_WORK / "b2-agent" / "outcome-record-spec.md"
MAP = TEAM_WORK / "b3-grounding" / "langchain-offerings-map.md"
FOLD = TEAM_WORK / "spec-fold-summary.md"
DESIGN = TEAM_WORK / "b3-grounding" / "design-review-record.md"


class TestResearchSpecLoserWording(unittest.TestCase):
    def setUp(self) -> None:
        self.text = flat(RESEARCH.read_text())

    def test_no_ad_test_language_in_research_spec(self) -> None:
        self.assertNotIn("kills the ad test", self.text)
        self.assertNotIn("ad test", self.text.lower())

    def test_no_minimum_spend_guard_language(self) -> None:
        self.assertNotIn("minimum spend", self.text.lower())

    def test_ad_set_pause_wording_states_guard_scope(self) -> None:
        self.assertIn("ad-set pause", self.text)
        self.assertIn("already-listed ad set", self.text)
        self.assertIn("authorizes no test budget", self.text)
        self.assertIn("human-approved written rule", self.text)


class TestMapSpecOnly(unittest.TestCase):
    def test_no_trial_only_language_remains_in_map(self) -> None:
        text = MAP.read_text()
        self.assertNotIn("deepagents trial only", text)
        self.assertNotIn("trial only", text)

    def test_map_states_spec_only_for_124(self) -> None:
        text = MAP.read_text()
        self.assertIn("spec-only", text)


class TestFoldSummaryHistorical(unittest.TestCase):
    def test_fold_trial_mentions_flagged_historical_not_normative(self) -> None:
        text = FOLD.read_text()
        self.assertIn("historical record", text)
        self.assertIn("DROPPED", text)


class TestWiringLegRequirementsDocumented(unittest.TestCase):
    def test_gate_before_every_write_and_fail_closed_documented(self) -> None:
        text = flat(RESEARCH.read_text())
        self.assertIn("before every catalog", text)
        self.assertIn("fail closed", text)

    def test_green_audit_proven_criteria_documented(self) -> None:
        text = flat(RESEARCH.read_text())
        self.assertIn("proven criteria", text)
        self.assertIn("owner sign-off", text)
        self.assertIn("revert", text.lower())

    def test_incomplete_verdict_flag_documented(self) -> None:
        text = flat(RESEARCH.read_text())
        self.assertIn("incomplete", text.lower())


if __name__ == "__main__":
    unittest.main()
