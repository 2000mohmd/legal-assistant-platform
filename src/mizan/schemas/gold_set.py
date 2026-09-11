"""Gold-set entry schema — see the root CLAUDE.md "Gold-set entry schema (extended)".

Every practice-area track scores against instances of GoldSetEntry. Keep this
in sync with the TypeScript mirror in frontend/src/types/gold-set.ts.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

EntryType = Literal["qa", "document_generation"]
EntryStatus = Literal["draft", "in_review", "approved"]
Difficulty = Literal["routine", "moderate", "high_stakes"]
ReviewModel = Literal["per_instance", "template_level"]


class Citation(BaseModel):
    source_document: str
    article_or_madda: str
    quoted_text: str | None = None


class GoldSetEntry(BaseModel):
    id: str
    practice_area: str
    entry_type: EntryType
    question: str
    answer: str
    expected_output: str | None = Field(
        default=None,
        description="For entry_type='document_generation': the correctly filled document/clause.",
    )
    citations: list[Citation]
    authored_by: str
    reviewed_by: str
    status: EntryStatus
    difficulty: Difficulty
    review_model: ReviewModel | None = None
    notes: str | None = None
