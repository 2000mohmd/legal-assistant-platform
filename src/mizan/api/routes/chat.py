"""POST /v1/chat — the real pipeline (retrieval -> generation -> mechanical
citation verification), replacing the frontend's fixture-based mock once
this is actually running and a corpus exists. See
`mizan.generation.answer_pipeline` for the orchestration this just wires
to HTTP, and `mizan.cli.ingest_corpus` for how a real dataset gets loaded.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from mizan.audit import log_event
from mizan.generation.answer_pipeline import (
    NOT_ENOUGH_CONTEXT_MESSAGE,
    answer_question,
    answer_question_high_stakes,
)
from mizan.generation.claude_client import ClaudeClient
from mizan.ingestion.loader import load_source_documents
from mizan.retrieval.bm25_index import Bm25Index

router = APIRouter()


class ChatRequest(BaseModel):
    practice_area: str
    question: str
    high_stakes: bool = False


class CitationOut(BaseModel):
    source_document: str
    article_or_madda: str
    quoted_text: str | None
    result: str
    note: str


class ChatResponse(BaseModel):
    text: str
    citations: list[CitationOut]
    verification: str
    grounded: bool
    council_note: str | None = None


@router.post("/v1/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    request_id = log_event(
        "chat_query_received",
        practice_area=request.practice_area,
        question=request.question,
        high_stakes=request.high_stakes,
    )

    corpus = load_source_documents(request.practice_area)
    log_event("retrieval_completed", request_id=request_id, corpus_documents=len(corpus))

    council_note: str | None = None

    # Construct ClaudeClient (and therefore require ANTHROPIC_API_KEY) only
    # once we know a model call will actually happen. Until a real corpus
    # exists, every request takes this branch — it must not fail just
    # because no API key is configured yet, since no key is needed for a
    # question this pipeline is going to refuse to guess at anyway.
    if not Bm25Index(corpus).search(request.question):
        log_event("generation_skipped", request_id=request_id, reason="no_retrieval_hits")
        return ChatResponse(
            text=NOT_ENOUGH_CONTEXT_MESSAGE, citations=[], verification="flagged", grounded=False
        )

    try:
        client = ClaudeClient()

        if request.high_stakes:
            # 2-3 frontier models per technique #5; only one vendor is
            # wired up today (ClaudeClient), so this currently compares two
            # calls to the SAME model rather than genuinely cross-vendor
            # council mode — that needs a second provider's client built
            # the same way, which is an infra/cost decision, not something
            # to fake here. Kept honest in the response via council_note
            # rather than silently overclaiming.
            models = {"primary": client.complete, "secondary": client.complete}
            result, council_note = answer_question_high_stakes(request.question, corpus, models)
        else:
            result = answer_question(request.question, corpus, client.complete)
    except Exception as exc:
        # Covers a missing/invalid ANTHROPIC_API_KEY and any transient
        # model-API failure alike — confirmed live that an unconfigured key
        # raises deep inside the anthropic SDK's request-building code, not
        # at ClaudeClient() construction, so this can't be narrowed to one
        # exception type without coupling to that SDK's internals. Never
        # pass the raw exception text back to the caller: it can contain
        # request-building internals, not just "no key configured".
        log_event("generation_failed", request_id=request_id, error_type=type(exc).__name__)
        raise HTTPException(
            status_code=503,
            detail="The AI service is temporarily unavailable. Please try again shortly.",
        ) from exc

    log_event(
        "generation_completed",
        request_id=request_id,
        verification=result.verification,
        grounded=result.grounded,
        citation_count=len(result.citation_checks),
    )

    return ChatResponse(
        text=result.text,
        citations=[
            CitationOut(
                source_document=c.citation.source_document,
                article_or_madda=c.citation.article_or_madda,
                quoted_text=c.citation.quoted_text,
                result=c.result,
                note=c.note,
            )
            for c in result.citation_checks
        ],
        verification=result.verification,
        grounded=result.grounded,
        council_note=council_note,
    )
