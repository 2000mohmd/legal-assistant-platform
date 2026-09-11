"""Pydantic models for ingested source documents (statutes, precedent, firm
templates). Structure only in Phase 0 — no retrieval or chunking logic yet.

The `Article` model exists at the clause level (technique #2: chunk by
article/madda boundary, never a fixed token window) and carries
`supersedes`/`superseded_by` so the citation-and-supersession graph
(technique #4) has somewhere to live once it's built — a repealed article
should never be silently citable as current law.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

DocumentType = Literal["statute", "precedent", "firm_template", "checklist"]


class Article(BaseModel):
    """One clause-level chunk — an article ("madda") or equivalent unit."""

    id: str
    number: str
    text: str
    supersedes: str | None = None
    superseded_by: str | None = None


class SourceDocument(BaseModel):
    id: str
    title: str
    practice_area: str
    document_type: DocumentType
    jurisdiction: str = "SA"
    articles: list[Article] = []
    ingested_at: str | None = None
    redacted: bool = False
