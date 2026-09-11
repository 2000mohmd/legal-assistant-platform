"""Council mode — technique #5 in the root CLAUDE.md.

"Route real-liability questions to 2-3 frontier models, surface
disagreement instead of silently picking one." This module orchestrates
already-instantiated completion callables (rather than a concrete client
type) so the disagreement-surfacing logic — which is content-agnostic — is
fully unit-testable without a real network call or API key.

Disagreement is judged by exact match after whitespace/case normalization.
That is a deliberately high bar for "agreement": two models are unlikely to
produce byte-identical phrasing even when they substantively agree, so this
will over-flag rather than under-flag. For a legal product that is the
right failure mode — a human reviewing a false-positive disagreement is
cheap; a silently-picked wrong answer is not. Replacing this with real
semantic-disagreement detection (e.g. an LLM-as-judge pass) is Phase 1+
work; deciding which real questions are "high-stakes" for a given practice
area is gated on that area's gold set.
"""

from __future__ import annotations

from collections.abc import Callable

from pydantic import BaseModel

CompletionFn = Callable[[str], str]


class CouncilResponse(BaseModel):
    model_name: str
    text: str


class CouncilResult(BaseModel):
    responses: list[CouncilResponse]
    disagreement: bool
    note: str


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def run_council(prompt: str, models: dict[str, CompletionFn]) -> CouncilResult:
    """Call every model on the same prompt and flag any disagreement.

    `models` maps a display name to a callable taking a prompt and
    returning text — pass bound `ClaudeClient.complete` methods (or
    equivalents for other vendors) in production, and fakes in tests.
    """
    if len(models) < 2:
        raise ValueError("Council mode requires at least two models to compare.")

    responses = [CouncilResponse(model_name=name, text=fn(prompt)) for name, fn in models.items()]

    distinct_answers = {_normalize(response.text) for response in responses}
    disagreement = len(distinct_answers) > 1

    note = (
        "Models disagreed — surface this to the reviewer instead of silently picking one."
        if disagreement
        else "All models agreed (after normalization)."
    )
    return CouncilResult(responses=responses, disagreement=disagreement, note=note)
