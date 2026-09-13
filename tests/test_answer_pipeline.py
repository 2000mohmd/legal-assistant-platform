"""Tests the retrieval -> generation -> verification orchestration with a
fake completion function — no API key, no real corpus, no network call.
Fabricated TEST-* fixtures throughout, per the anti-fabrication rule.
"""

import json

from mizan.generation.answer_pipeline import (
    NOT_ENOUGH_CONTEXT_MESSAGE,
    answer_question,
    answer_question_high_stakes,
)
from mizan.schemas.documents import Article, SourceDocument

CORPUS = [
    SourceDocument(
        id="test-doc-1",
        title="TEST-STATUTE",
        practice_area="marriage_family",
        document_type="statute",
        articles=[
            Article(id="a1", number="TEST-ART-1", text="A dowry may be paid upfront or deferred."),
            Article(
                id="a2", number="TEST-ART-2", text="Custody follows the child's best interest."
            ),
        ],
    )
]


def fake_model(response: dict):
    """Returns a completion function that always returns `response` as JSON."""
    return lambda _prompt: json.dumps(response)


def test_refuses_to_answer_with_no_corpus():
    result = answer_question(
        "Can the dowry be deferred?", corpus=[], complete_fn=lambda p: "unused"
    )
    assert result.grounded is False
    assert result.verification == "flagged"
    assert result.text == NOT_ENOUGH_CONTEXT_MESSAGE


def test_refuses_to_answer_when_nothing_matches_the_query():
    result = answer_question(
        "What is the capital of France?", corpus=CORPUS, complete_fn=lambda p: "unused"
    )
    assert result.grounded is False


def test_verified_when_model_cites_real_matching_text():
    complete = fake_model(
        {
            "answer": "The dowry may be deferred.",
            "citations": [
                {
                    "source_document": "TEST-STATUTE",
                    "article_or_madda": "TEST-ART-1",
                    "quoted_text": "paid upfront or deferred",
                }
            ],
        }
    )
    result = answer_question("Can the dowry be deferred?", corpus=CORPUS, complete_fn=complete)
    assert result.grounded is True
    assert result.verification == "verified"
    assert result.citation_checks[0].result == "passed"


def test_flagged_when_model_hallucinates_a_citation():
    complete = fake_model(
        {
            "answer": "The dowry may be deferred.",
            "citations": [
                {
                    "source_document": "TEST-STATUTE",
                    "article_or_madda": "TEST-ART-999",
                    "quoted_text": "this article does not exist",
                }
            ],
        }
    )
    result = answer_question("Can the dowry be deferred?", corpus=CORPUS, complete_fn=complete)
    assert result.verification == "flagged"
    assert result.citation_checks[0].result == "flagged"


def test_flagged_when_model_answers_with_no_citations_at_all():
    complete = fake_model({"answer": "The dowry may be deferred.", "citations": []})
    result = answer_question("Can the dowry be deferred?", corpus=CORPUS, complete_fn=complete)
    assert result.verification == "flagged"


def test_flagged_when_model_response_is_not_valid_json():
    result = answer_question(
        "Can the dowry be deferred?", corpus=CORPUS, complete_fn=lambda p: "not json at all"
    )
    assert result.verification == "flagged"
    assert result.grounded is True
    assert result.text == "not json at all"


def test_high_stakes_runs_council_and_surfaces_disagreement():
    models = {
        "model-a": fake_model({"answer": "Answer A", "citations": []}),
        "model-b": fake_model({"answer": "Answer B", "citations": []}),
    }
    result, note = answer_question_high_stakes("Who gets custody?", corpus=CORPUS, models=models)
    assert "disagreed" in note
    assert result.verification == "flagged"


def test_high_stakes_with_no_corpus_does_not_invoke_council():
    calls = []
    models = {
        "model-a": lambda p: calls.append(p) or json.dumps({"answer": "x", "citations": []}),
        "model-b": lambda p: calls.append(p) or json.dumps({"answer": "x", "citations": []}),
    }
    result, note = answer_question_high_stakes("Who gets custody?", corpus=[], models=models)
    assert result.grounded is False
    assert calls == []
