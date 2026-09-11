"""The regulatory gate must stay closed until root CLAUDE.md's blocking item
is resolved. If this test ever needs changing to pass, that change itself
is the signal to go re-read the blocking item — not a routine test fix.
"""

import pytest

from mizan.generation.document_assembly import DocumentGenerationDisabled, assemble_document
from mizan.schemas.templates import DocumentTemplate, TemplateField

PER_INSTANCE_TEMPLATE = DocumentTemplate(
    id="test-tmpl-per-instance",
    name="Test Per-Instance Template",
    practice_area="marriage_family",
    review_model="per_instance",
    fields=[TemplateField(name="situation", label="Situation", field_type="textarea")],
    body_template="Test {{ situation }}",
)

UNAPPROVED_TEMPLATE_LEVEL_TEMPLATE = DocumentTemplate(
    id="test-tmpl-template-level",
    name="Test Template-Level Template",
    practice_area="marriage_family",
    review_model="template_level",
    fields=[],
    body_template="Test body",
    lawyer_approved=False,
)


def test_assembly_disabled_by_default_regardless_of_template():
    with pytest.raises(DocumentGenerationDisabled):
        assemble_document(PER_INSTANCE_TEMPLATE, {"situation": "test"})


def test_assembly_disabled_even_for_template_level_when_globally_off():
    with pytest.raises(DocumentGenerationDisabled):
        assemble_document(UNAPPROVED_TEMPLATE_LEVEL_TEMPLATE, {})
