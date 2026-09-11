"""Tests for the actual rendering logic in document_assembly.py, exercised
only once the gate is force-opened via monkeypatch — never how this would
be flipped in production. See test_document_assembly_gate.py for the
default-closed behavior these tests deliberately bypass to reach the
rendering code at all.
"""

import pytest

from mizan.generation import document_assembly
from mizan.schemas.templates import DocumentTemplate, TemplateField

APPROVED_TEMPLATE = DocumentTemplate(
    id="test-tmpl-approved",
    name="Test Approved Template",
    practice_area="marriage_family",
    review_model="template_level",
    fields=[
        TemplateField(name="client_name", label="Client Name", field_type="text"),
        TemplateField(name="note", label="Note", field_type="text", required=False),
    ],
    body_template="Dear {{ client_name }}, {{ note }}",
    lawyer_approved=True,
)


@pytest.fixture
def gate_open(monkeypatch):
    monkeypatch.setattr(document_assembly, "DOCUMENT_GENERATION_ENABLED", True)


def test_renders_template_with_provided_fields(gate_open):
    result = document_assembly.assemble_document(
        APPROVED_TEMPLATE, {"client_name": "TEST-CLIENT", "note": "welcome."}
    )
    assert result == "Dear TEST-CLIENT, welcome."


def test_optional_field_can_be_omitted(gate_open):
    result = document_assembly.assemble_document(APPROVED_TEMPLATE, {"client_name": "TEST-CLIENT"})
    assert result == "Dear TEST-CLIENT, "


def test_missing_required_field_raises(gate_open):
    with pytest.raises(ValueError, match="client_name"):
        document_assembly.assemble_document(APPROVED_TEMPLATE, {"note": "welcome."})


def test_still_gated_per_instance_even_when_globally_enabled(gate_open):
    per_instance = APPROVED_TEMPLATE.model_copy(
        update={"id": "test-tmpl-per-instance", "review_model": "per_instance"}
    )
    with pytest.raises(document_assembly.DocumentGenerationDisabled):
        document_assembly.assemble_document(per_instance, {"client_name": "TEST-CLIENT"})


def test_still_gated_when_template_not_lawyer_approved(gate_open):
    unapproved = APPROVED_TEMPLATE.model_copy(update={"lawyer_approved": False})
    with pytest.raises(document_assembly.DocumentGenerationDisabled):
        document_assembly.assemble_document(unapproved, {"client_name": "TEST-CLIENT"})
