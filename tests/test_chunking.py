"""Fabricated TEST-* fixtures only — see the anti-fabrication rule in the
root CLAUDE.md. Fake Arabic placeholder text is deliberately generic
("test text for article one") rather than resembling real statutory
language.
"""

from mizan.ingestion.chunking import chunk_by_article_boundary

FAKE_ENGLISH_TEXT = """Article TEST-1
This is fake clause text for article one.

Article TEST-2
This is fake clause text for article two.
"""

FAKE_ARABIC_TEXT = """المادة رقم TEST-1
هذا نص وهمي لأغراض الاختبار فقط - المادة الأولى.

المادة رقم TEST-2
هذا نص وهمي لأغراض الاختبار فقط - المادة الثانية.
"""


def test_splits_on_english_article_boundaries():
    articles = chunk_by_article_boundary(FAKE_ENGLISH_TEXT)
    assert [a.number for a in articles] == ["TEST-1", "TEST-2"]
    assert "clause text for article one" in articles[0].text
    assert "Article TEST-2" not in articles[0].text


def test_splits_on_arabic_madda_boundaries():
    articles = chunk_by_article_boundary(FAKE_ARABIC_TEXT)
    assert [a.number for a in articles] == ["TEST-1", "TEST-2"]


def test_falls_back_to_single_unknown_chunk_when_no_boundary_found():
    articles = chunk_by_article_boundary("Just some plain text with no markers at all.")
    assert len(articles) == 1
    assert articles[0].number == "UNKNOWN"


def test_custom_boundary_pattern():
    text = "SEC. TEST-9\nCustom heading style body text."
    articles = chunk_by_article_boundary(text, boundary_patterns=[r"^SEC\.\s+(\S+)"])
    assert articles[0].number == "TEST-9"
    assert "Custom heading style body text" in articles[0].text
