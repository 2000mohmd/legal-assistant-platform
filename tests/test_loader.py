from mizan.ingestion.loader import load_source_documents


def test_load_source_documents_returns_empty_list_when_no_corpus_yet():
    # No real documents have been ingested for any practice area yet (root
    # CLAUDE.md Non-Negotiables) — the loader must handle that gracefully
    # rather than erroring.
    assert load_source_documents("marriage_family") == []


def test_load_source_documents_returns_empty_list_for_unknown_area():
    assert load_source_documents("nonexistent_area") == []
