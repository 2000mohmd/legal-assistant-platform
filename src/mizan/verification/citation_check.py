"""Mechanical citation verification — technique #3 in the root CLAUDE.md.

"A separate, deterministic check confirms every cited article exists in the
retrieved source and says what the draft claims. Unverifiable citations are
flagged/stripped, never shown as fact." This is called out as the
highest-leverage anti-hallucination step in the pipeline — it must never
degrade into best-effort, so every citation this module looks at gets an
explicit passed/flagged verdict with a reason, never a silent skip.

This module is deliberately content-agnostic: it operates on whatever
SourceDocument/Citation it is handed, so it needs no practice-area gold set
to exist or be reviewed before being written (see "How to work in this
repo" in the root CLAUDE.md). Wiring it up to a real practice area's real,
retrieved corpus is Phase 1+ work, gated on that area's gold set.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from mizan.schemas.documents import SourceDocument
from mizan.schemas.gold_set import Citation

CitationCheckResult = Literal["passed", "flagged"]


class CitationCheck(BaseModel):
    citation: Citation
    result: CitationCheckResult
    note: str


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def verify_citation(citation: Citation, source: SourceDocument) -> CitationCheck:
    """Check a single citation against one candidate source document.

    PASSED requires: the source title matches, an article with this number
    exists in it, and — if the citation carries quoted_text — that text
    appears (case-insensitive, whitespace-normalized) within the article.
    Anything else is FLAGGED with a specific reason.
    """
    if source.title != citation.source_document:
        return CitationCheck(
            citation=citation,
            result="flagged",
            note=(
                f"Source document '{citation.source_document}' does not match "
                f"retrieved '{source.title}'."
            ),
        )

    article = next((a for a in source.articles if a.number == citation.article_or_madda), None)
    if article is None:
        return CitationCheck(
            citation=citation,
            result="flagged",
            note=f"Article '{citation.article_or_madda}' not found in '{source.title}'.",
        )

    if citation.quoted_text and _normalize(citation.quoted_text) not in _normalize(article.text):
        return CitationCheck(
            citation=citation,
            result="flagged",
            note="Quoted text does not appear in the retrieved article — possible hallucination.",
        )

    return CitationCheck(
        citation=citation, result="passed", note="Article exists and quoted text matches."
    )


def verify_citations(
    citations: list[Citation], corpus: list[SourceDocument]
) -> list[CitationCheck]:
    """Verify each citation against whichever document in the corpus it names."""
    by_title = {doc.title: doc for doc in corpus}
    results: list[CitationCheck] = []
    for citation in citations:
        source = by_title.get(citation.source_document)
        if source is None:
            results.append(
                CitationCheck(
                    citation=citation,
                    result="flagged",
                    note=(
                        f"Source document '{citation.source_document}' "
                        "not found in retrieved corpus."
                    ),
                )
            )
            continue
        results.append(verify_citation(citation, source))
    return results
