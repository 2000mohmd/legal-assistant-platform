"""API-level tests. Deliberately does NOT set ANTHROPIC_API_KEY — the point
of test_chat_with_no_corpus_does_not_require_an_api_key is to prove the
"nothing to retrieve yet" path (the normal case until a real corpus exists)
never constructs a real model client at all.

The internal API key (see api/security.py) is set to a fixed test value in
every request here — auth itself is covered separately in
test_api_security.py; these tests are about the chat behavior once past it.
"""

from fastapi.testclient import TestClient

import mizan.api.routes.chat as chat_route
from mizan.api.main import app
from mizan.schemas.documents import Article, SourceDocument

client = TestClient(app)

AUTH_HEADERS = {"x-internal-api-key": "test-secret"}

FAKE_CORPUS = [
    SourceDocument(
        id="test-doc-1",
        title="TEST-STATUTE",
        practice_area="marriage_family",
        document_type="statute",
        articles=[Article(id="a1", number="TEST-ART-1", text="A dowry may be deferred.")],
    )
]


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chat_with_no_corpus_does_not_require_an_api_key(monkeypatch):
    monkeypatch.setenv("MIZAN_INTERNAL_API_KEY", "test-secret")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    response = client.post(
        "/v1/chat",
        json={"practice_area": "nonexistent_test_area", "question": "Can the dowry be deferred?"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is False
    assert body["verification"] == "flagged"
    assert body["citations"] == []


def test_chat_returns_503_not_a_raw_traceback_when_model_call_fails(monkeypatch):
    """With a matching corpus (so the model path is actually reached) but no
    real API key, the route must return a clean 503 — not leak the
    anthropic SDK's internal exception text to the caller."""
    monkeypatch.setenv("MIZAN_INTERNAL_API_KEY", "test-secret")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setattr(chat_route, "load_source_documents", lambda area: FAKE_CORPUS)

    response = client.post(
        "/v1/chat",
        json={"practice_area": "marriage_family", "question": "Can the dowry be deferred?"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 503
    assert "temporarily unavailable" in response.json()["detail"]
    assert "api_key" not in response.text.lower()
