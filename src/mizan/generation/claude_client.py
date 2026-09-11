"""Thin wrapper around the anthropic SDK — prompt in, response out.

This is the ONLY point in the pipeline that is allowed to cross the
jurisdiction boundary (root CLAUDE.md "Architecture principle: the
jurisdiction boundary"): everything else — retrieval, verification,
generation orchestration — lives inside infrastructure we control. To keep
that boundary explicit in code rather than implicit in call order, this
wrapper redacts every prompt before it leaves the process; callers should
never bypass it by calling the anthropic SDK directly elsewhere.

No retrieval, verification, or council-mode logic belongs here — this is
intentionally the dumbest possible client.
"""

from __future__ import annotations

from anthropic import Anthropic

from mizan.ingestion.redact import redact_pii

DEFAULT_MODEL = "claude-sonnet-5"


class ClaudeClient:
    def __init__(self, api_key: str | None = None, model: str = DEFAULT_MODEL) -> None:
        self._client = Anthropic(api_key=api_key)
        self._model = model

    def complete(self, prompt: str, *, max_tokens: int = 1024) -> str:
        """Send a single redacted prompt and return the raw text response."""
        redacted_prompt = redact_pii(prompt)
        response = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": redacted_prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")
