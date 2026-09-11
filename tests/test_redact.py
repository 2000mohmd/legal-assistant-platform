from mizan.ingestion.redact import REDACTED_EMAIL, REDACTED_PHONE, redact_pii


def test_redacts_email():
    result = redact_pii("Contact test.user@example.com for details.")
    assert REDACTED_EMAIL in result
    assert "test.user@example.com" not in result


def test_redacts_phone_number():
    result = redact_pii("Call +966 555 123 456 for details.")
    assert REDACTED_PHONE in result
    assert "555 123 456" not in result


def test_leaves_ordinary_text_untouched():
    text = "This sentence has no PII in it at all."
    assert redact_pii(text) == text
