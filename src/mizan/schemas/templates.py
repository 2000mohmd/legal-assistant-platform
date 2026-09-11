"""Pydantic models for a document template and its fill-in fields.

`review_model` is required, not optional-with-a-default: the root CLAUDE.md
non-negotiables state the per-instance vs. template-level decision must be
recorded per document type, never defaulted. A template cannot be
constructed without picking one.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

ReviewModel = Literal["per_instance", "template_level"]
FieldType = Literal["text", "textarea", "choice", "boolean", "date"]


class TemplateField(BaseModel):
    name: str
    label: str
    field_type: FieldType
    required: bool = True
    choices: list[str] | None = None


class DocumentTemplate(BaseModel):
    id: str
    name: str
    practice_area: str
    review_model: ReviewModel
    fields: list[TemplateField]
    body_template: str
    lawyer_approved: bool = False
    approved_by: str | None = None
