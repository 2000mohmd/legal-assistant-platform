"""Loads a practice area's source documents from data/practice_areas/<area>/
into the pipeline's in-memory store.

Phase 0: no real documents have been ingested yet (see root CLAUDE.md
Non-Negotiables — nothing real lands here without the PDPL/data-residency
review). This just walks the expected directory layout and parses whatever
JSON documents it finds, so the ingestion path exists and is testable before
any real corpus arrives.
"""

from __future__ import annotations

import json
from pathlib import Path

from mizan.schemas.documents import SourceDocument

DATA_ROOT = Path(__file__).resolve().parents[3] / "data" / "practice_areas"


def load_source_documents(practice_area: str) -> list[SourceDocument]:
    """Load every *.json SourceDocument under data/practice_areas/<practice_area>/corpus/."""
    corpus_dir = DATA_ROOT / practice_area / "corpus"
    if not corpus_dir.exists():
        return []

    documents: list[SourceDocument] = []
    for path in sorted(corpus_dir.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        documents.append(SourceDocument.model_validate(raw))
    return documents
