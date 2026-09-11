"""Schema tests for GoldSetEntry / Citation.

All content below is fabricated ("TEST-ART-1" style) per the root CLAUDE.md
anti-fabrication rule — never real Saudi statutory text, even in fixtures.
"""

import pytest
from pydantic import ValidationError

from mizan.schemas.gold_set import Citation, GoldSetEntry

VALID_ENTRY = {
    "id": "test-qa-001",
    "practice_area": "marriage_family",
    "entry_type": "qa",
    "question": "Test question?",
    "answer": "Test answer.",
    "citations": [
        {
            "source_document": "TEST-STATUTE",
            "article_or_madda": "TEST-ART-1",
            "quoted_text": "Test quoted text.",
        }
    ],
    "authored_by": "test-lawyer-a",
    "reviewed_by": "test-lawyer-b",
    "status": "approved",
    "difficulty": "routine",
    "review_model": None,
}


def test_valid_qa_entry_parses():
    entry = GoldSetEntry.model_validate(VALID_ENTRY)
    assert entry.id == "test-qa-001"
    assert entry.citations[0].article_or_madda == "TEST-ART-1"


def test_document_generation_entry_allows_expected_output():
    entry = GoldSetEntry.model_validate(
        {
            **VALID_ENTRY,
            "entry_type": "document_generation",
            "expected_output": "TEST-CLAUSE-1",
            "review_model": "per_instance",
        }
    )
    assert entry.expected_output == "TEST-CLAUSE-1"
    assert entry.review_model == "per_instance"


@pytest.mark.parametrize("missing_field", ["id", "practice_area", "citations", "status"])
def test_missing_required_field_rejected(missing_field):
    incomplete = {k: v for k, v in VALID_ENTRY.items() if k != missing_field}
    with pytest.raises(ValidationError):
        GoldSetEntry.model_validate(incomplete)


def test_invalid_status_literal_rejected():
    with pytest.raises(ValidationError):
        GoldSetEntry.model_validate({**VALID_ENTRY, "status": "not_a_real_status"})


def test_citation_without_quoted_text_is_allowed():
    citation = Citation(source_document="TEST-STATUTE", article_or_madda="TEST-ART-2")
    assert citation.quoted_text is None
