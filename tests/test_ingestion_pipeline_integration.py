"""Proves the ingestion -> verification seam chain actually works together,
not just in isolated unit tests. Uses a temp directory (not data/) so no
fabricated content ever sits inside the real data/practice_areas/ tree,
which is reserved for genuine firm-sourced material.
"""

import json

from mizan.ingestion import loader
from mizan.schemas.gold_set import Citation
from mizan.verification.citation_check import verify_citations

FAKE_SOURCE_DOCUMENT = {
    "id": "test-doc-1",
    "title": "TEST-STATUTE",
    "practice_area": "marriage_family",
    "document_type": "statute",
    "articles": [
        {"id": "a1", "number": "TEST-ART-1", "text": "Fake clause text for article one."},
    ],
}


def test_loader_output_flows_into_citation_verification(tmp_path, monkeypatch):
    corpus_dir = tmp_path / "marriage_family" / "corpus"
    corpus_dir.mkdir(parents=True)
    (corpus_dir / "test_statute.json").write_text(
        json.dumps(FAKE_SOURCE_DOCUMENT), encoding="utf-8"
    )
    monkeypatch.setattr(loader, "DATA_ROOT", tmp_path)

    documents = loader.load_source_documents("marriage_family")
    assert len(documents) == 1

    matching = Citation(source_document="TEST-STATUTE", article_or_madda="TEST-ART-1")
    hallucinated = Citation(
        source_document="TEST-STATUTE",
        article_or_madda="TEST-ART-1",
        quoted_text="text that was never in the article",
    )

    results = verify_citations([matching, hallucinated], corpus=documents)

    assert results[0].result == "passed"
    assert results[1].result == "flagged"
