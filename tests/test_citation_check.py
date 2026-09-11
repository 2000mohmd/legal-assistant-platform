"""Tests for the mechanical citation-verification pass (technique #3).

All content is fabricated TEST-* fixtures per the root CLAUDE.md
anti-fabrication rule.
"""

from mizan.schemas.documents import Article, SourceDocument
from mizan.schemas.gold_set import Citation
from mizan.verification.citation_check import verify_citation, verify_citations

SOURCE = SourceDocument(
    id="test-doc-1",
    title="TEST-STATUTE",
    practice_area="marriage_family",
    document_type="statute",
    articles=[
        Article(id="a1", number="TEST-ART-1", text="The test clause states X applies."),
        Article(id="a2", number="TEST-ART-2", text="The test clause states Y applies."),
    ],
)


def test_passes_when_article_and_quote_match():
    citation = Citation(
        source_document="TEST-STATUTE",
        article_or_madda="TEST-ART-1",
        quoted_text="states X applies",
    )
    result = verify_citation(citation, SOURCE)
    assert result.result == "passed"


def test_passes_case_and_whitespace_insensitively():
    citation = Citation(
        source_document="TEST-STATUTE",
        article_or_madda="TEST-ART-1",
        quoted_text="  STATES   x APPLIES  ",
    )
    assert verify_citation(citation, SOURCE).result == "passed"


def test_flags_wrong_source_document():
    citation = Citation(source_document="TEST-OTHER-STATUTE", article_or_madda="TEST-ART-1")
    result = verify_citation(citation, SOURCE)
    assert result.result == "flagged"
    assert "does not match" in result.note


def test_flags_missing_article():
    citation = Citation(source_document="TEST-STATUTE", article_or_madda="TEST-ART-999")
    result = verify_citation(citation, SOURCE)
    assert result.result == "flagged"
    assert "not found" in result.note


def test_flags_quote_not_in_article_text():
    citation = Citation(
        source_document="TEST-STATUTE",
        article_or_madda="TEST-ART-1",
        quoted_text="this text was never in the article",
    )
    result = verify_citation(citation, SOURCE)
    assert result.result == "flagged"
    assert "hallucination" in result.note


def test_citation_without_quoted_text_passes_on_article_existence_alone():
    citation = Citation(source_document="TEST-STATUTE", article_or_madda="TEST-ART-2")
    assert verify_citation(citation, SOURCE).result == "passed"


def test_verify_citations_flags_unknown_source_in_corpus():
    citations = [Citation(source_document="TEST-UNKNOWN", article_or_madda="TEST-ART-1")]
    results = verify_citations(citations, corpus=[SOURCE])
    assert results[0].result == "flagged"
    assert "not found in retrieved corpus" in results[0].note


def test_verify_citations_batch_mixed_results():
    citations = [
        Citation(source_document="TEST-STATUTE", article_or_madda="TEST-ART-1"),
        Citation(source_document="TEST-STATUTE", article_or_madda="TEST-ART-999"),
    ]
    results = verify_citations(citations, corpus=[SOURCE])
    assert [r.result for r in results] == ["passed", "flagged"]
