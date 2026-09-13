"""Audit logging — root CLAUDE.md non-negotiable: "every query, retrieval,
generation... logged" from the first working version, not added later.

Structured JSON lines to stdout (a process manager / log aggregator is
expected to capture and ship these in any real deployment; this module
doesn't own where logs end up, only that every pipeline call produces one).
The question/answer text is redacted before logging, same seam used before
anything crosses the jurisdiction boundary to the model — an audit log is
still a place PII shouldn't accumulate in the clear.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any

from mizan.ingestion.redact import redact_pii

logger = logging.getLogger("mizan.audit")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def log_event(event: str, **fields: Any) -> str:
    """Logs one structured audit event; returns a request_id for correlating
    the query/retrieval/generation steps of a single pipeline call."""
    request_id = fields.pop("request_id", None) or str(uuid.uuid4())
    redacted = {
        key: redact_pii(value) if isinstance(value, str) else value for key, value in fields.items()
    }
    logger.info(
        json.dumps(
            {
                "event": event,
                "request_id": request_id,
                "timestamp": time.time(),
                **redacted,
            }
        )
    )
    return request_id
