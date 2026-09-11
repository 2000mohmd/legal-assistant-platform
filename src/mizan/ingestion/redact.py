"""PII redaction seam — root CLAUDE.md non-negotiable: "PII redaction on
anything crossing the jurisdiction boundary — even in Phase 0 scaffolding,
leave the seam rather than passing raw documents through."

This is a placeholder, not a PDPL-compliant redaction pipeline. It catches
a few obvious, high-confidence patterns (email addresses, phone numbers) so
the seam does *something* real rather than being a pure no-op, but it must
not be mistaken for complete PII coverage — Saudi national ID numbers,
names, addresses, and other identifiers are not handled here. Real
redaction is Phase 1+ work, informed by the PDPL assessment called out in
the root CLAUDE.md Non-Negotiables.
"""

from __future__ import annotations

import re

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d[\d\- ]{7,}\d)(?!\d)")

REDACTED_EMAIL = "[REDACTED_EMAIL]"
REDACTED_PHONE = "[REDACTED_PHONE]"


def redact_pii(text: str) -> str:
    """Best-effort placeholder redaction. Not exhaustive — see module docstring."""
    text = _EMAIL_RE.sub(REDACTED_EMAIL, text)
    text = _PHONE_RE.sub(REDACTED_PHONE, text)
    return text
