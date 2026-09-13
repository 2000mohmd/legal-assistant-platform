from fastapi.testclient import TestClient

from mizan.api.main import app

client = TestClient(app)


def test_chat_rejected_without_api_key(monkeypatch):
    monkeypatch.setenv("MIZAN_INTERNAL_API_KEY", "test-secret")
    response = client.post(
        "/v1/chat", json={"practice_area": "marriage_family", "question": "test?"}
    )
    assert response.status_code == 401


def test_chat_rejected_with_wrong_api_key(monkeypatch):
    monkeypatch.setenv("MIZAN_INTERNAL_API_KEY", "test-secret")
    response = client.post(
        "/v1/chat",
        json={"practice_area": "marriage_family", "question": "test?"},
        headers={"x-internal-api-key": "wrong-value"},
    )
    assert response.status_code == 401


def test_chat_accepted_with_correct_api_key(monkeypatch):
    monkeypatch.setenv("MIZAN_INTERNAL_API_KEY", "test-secret")
    response = client.post(
        "/v1/chat",
        json={"practice_area": "nonexistent_test_area", "question": "test?"},
        headers={"x-internal-api-key": "test-secret"},
    )
    assert response.status_code == 200


def test_fails_closed_when_server_key_is_not_configured(monkeypatch):
    monkeypatch.delenv("MIZAN_INTERNAL_API_KEY", raising=False)
    response = client.post(
        "/v1/chat",
        json={"practice_area": "marriage_family", "question": "test?"},
        headers={"x-internal-api-key": "anything"},
    )
    assert response.status_code == 500


def test_health_check_does_not_require_api_key(monkeypatch):
    monkeypatch.delenv("MIZAN_INTERNAL_API_KEY", raising=False)
    response = client.get("/health")
    assert response.status_code == 200
