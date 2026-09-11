"""Document-assembly seam — template-filling from verified structured data.

GATED: root CLAUDE.md's blocking regulatory/licensing item. Do not build or
ship any consumer-facing document-generation feature until the partner has
confirmed in writing that a law firm may offer AI-assisted document
preparation directly to the public without per-instance lawyer review (or,
for template-level tracks, until a lawyer has approved that specific
template). This module is intentionally inert in Phase 0: it defines the
seam's shape but always refuses to run, so nothing can be wired up to reach
a real client through it by accident.

When the blocking item is resolved for a given template, flipping this on
still requires the review-model decision to be present and honored per
document type (see schemas.templates.DocumentTemplate.review_model) —
never defaulted, per the Non-Negotiables.
"""

from __future__ import annotations

from mizan.schemas.templates import DocumentTemplate

DOCUMENT_GENERATION_ENABLED = False


class DocumentGenerationDisabled(RuntimeError):
    """Raised whenever document assembly is invoked while the regulatory
    blocking item (root CLAUDE.md) has not been resolved for this template."""


def assemble_document(template: DocumentTemplate, filled_fields: dict[str, str]) -> str:
    if not DOCUMENT_GENERATION_ENABLED:
        raise DocumentGenerationDisabled(
            f"Document generation for template '{template.id}' is disabled by default "
            "pending the partner's written regulatory/licensing confirmation "
            "(see root CLAUDE.md blocking item)."
        )

    if template.review_model == "per_instance":
        raise DocumentGenerationDisabled(
            f"Template '{template.id}' uses per-instance review — assembled output "
            "must be queued for lawyer review before delivery, not returned directly."
        )
    if not template.lawyer_approved:
        raise DocumentGenerationDisabled(
            f"Template '{template.id}' is template-level review but has not been "
            "lawyer_approved — cannot ship unreviewed output."
        )

    raise NotImplementedError("Template-filling logic is not implemented yet (Phase 1+).")
