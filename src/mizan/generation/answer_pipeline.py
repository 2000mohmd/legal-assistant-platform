"""Orchestrates retrieval -> generation -> mechanical citation verification
into one answer. This is the seam tomorrow's real corpus plugs into — see
`mizan.api.routes.chat` for the HTTP endpoint that calls this, and
`mizan.cli.ingest_corpus` for how a real dataset gets into the shape this
expects.

The orchestration logic itself is content-agnostic (same reasoning as
retrieval/verification/ingestion elsewhere in this package) and is fully
unit-tested with a fake completion function — no API key or real corpus
needed to verify the *plumbing* is correct. What it cannot do yet, because
nothing here fabricates it, is produce a real answer: with no corpus, it
correctly refuses to call the model at all rather than let it guess
ungrounded, which is the anti-hallucination principle applied one level
higher than the citation-check pass alone.
"""

from __future__ import annotations

import json
from collections.abc import Callable

from pydantic import BaseModel

from mizan.retrieval.bm25_index import Bm25Index
from mizan.schemas.documents import Article, SourceDocument
from mizan.schemas.gold_set import Citation
from mizan.verification.citation_check import CitationCheck, verify_citations

CompletionFn = Callable[[str], str]

NOT_ENOUGH_CONTEXT_MESSAGE = (
    "No verified source material is available for this question yet. "
    "Rather than guess, this has been left unanswered pending a reviewed corpus."
)


class AnswerResult(BaseModel):
    text: str
    citation_checks: list[CitationCheck]
    verification: str  # "verified" | "flagged"
    grounded: bool
    """False when there was no retrieved context at all — the question was
    refused rather than answered ungrounded."""


def _build_prompt(question: str, hits: list[tuple[SourceDocument, Article, float]]) -> str:
    excerpts = "\n\n".join(
        f'Source: "{doc.title}", Article {article.number}\n{article.text}'
        for doc, article, _score in hits
    )
    return (
        "Answer the question using ONLY the excerpts below. Do not use outside "
        "knowledge. Respond with strict JSON only, no other text, in exactly this "
        "shape:\n"
        '{"answer": "...", "citations": [{"source_document": "...", '
        '"article_or_madda": "...", "quoted_text": "..."}]}\n\n'
        "Every citation's quoted_text must be copied verbatim from the excerpts "
        "below, not paraphrased. If the excerpts do not answer the question, "
        'return {"answer": "", "citations": []}.\n\n'
        f"Excerpts:\n{excerpts}\n\nQuestion: {question}"
    )


def _parse_and_verify(raw: str, retrieved_docs: list[SourceDocument]) -> AnswerResult:
    try:
        parsed = json.loads(raw)
        answer_text = parsed["answer"]
        citations = [
            Citation(
                source_document=c["source_document"],
                article_or_madda=c["article_or_madda"],
                quoted_text=c.get("quoted_text"),
            )
            for c in parsed.get("citations", [])
        ]
    except (json.JSONDecodeError, KeyError, TypeError):
        # The model didn't follow the format — treat the whole response as
        # unverifiable rather than guessing at citations that aren't there.
        return AnswerResult(text=raw, citation_checks=[], verification="flagged", grounded=True)

    checks: list[CitationCheck] = verify_citations(citations, retrieved_docs)
    all_passed = len(checks) > 0 and all(c.result == "passed" for c in checks)
    return AnswerResult(
        text=answer_text,
        citation_checks=checks,
        verification="verified" if all_passed else "flagged",
        grounded=True,
    )


def answer_question(
    question: str,
    corpus: list[SourceDocument],
    complete_fn: CompletionFn,
    *,
    top_k: int = 5,
) -> AnswerResult:
    """Retrieve, generate, and mechanically verify an answer to `question`.

    `complete_fn` is any `str -> str` callable — pass a bound
    `ClaudeClient.complete` in production, a fake in tests (same pattern as
    `council.orchestrator.run_council`).
    """
    hits = Bm25Index(corpus).search(question, top_k=top_k)
    if not hits:
        return AnswerResult(
            text=NOT_ENOUGH_CONTEXT_MESSAGE,
            citation_checks=[],
            verification="flagged",
            grounded=False,
        )

    raw = complete_fn(_build_prompt(question, hits))
    return _parse_and_verify(raw, [doc for doc, _article, _score in hits])


def answer_question_high_stakes(
    question: str,
    corpus: list[SourceDocument],
    models: dict[str, CompletionFn],
) -> tuple[AnswerResult, str]:
    """Same as answer_question, but runs council mode (technique #5) across
    `models` and surfaces disagreement instead of picking one silently.
    Returns (result, council_note).

    Deciding *which real questions* are high-stakes for a live practice
    area is gated on that area's gold set (see root CLAUDE.md); this
    function is the content-agnostic orchestration a caller can route into
    once that decision is made.
    """
    from mizan.council.orchestrator import run_council

    hits = Bm25Index(corpus).search(question)
    if not hits:
        return (
            AnswerResult(
                text=NOT_ENOUGH_CONTEXT_MESSAGE,
                citation_checks=[],
                verification="flagged",
                grounded=False,
            ),
            "No retrieved context — council was not invoked.",
        )

    prompt = _build_prompt(question, hits)
    council_result = run_council(prompt, models)
    raw = council_result.responses[0].text if council_result.responses else ""
    result = _parse_and_verify(raw, [doc for doc, _article, _score in hits])
    return result, council_result.note
