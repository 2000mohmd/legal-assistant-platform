"""Schema tests for SourceDocument/Article and DocumentTemplate/TemplateField.

Fabricated TEST-* identifiers only — see the anti-fabrication rule in the
root CLAUDE.md.
"""

import pytest
from pydantic import ValidationError

from mizan.schemas.documents import Article, SourceDocument
from mizan.schemas.templates import DocumentTemplate, TemplateField


def test_source_document_with_articles():
    doc = SourceDocument(
        id="test-doc-1",
        title="Test Statute",
        practice_area="marriage_family",
        document_type="statute",
        articles=[Article(id="a1", number="TEST-ART-1", text="Test clause text.")],
    )
    assert doc.jurisdiction == "SA"
    assert doc.articles[0].number == "TEST-ART-1"
    assert doc.articles[0].superseded_by is None


def test_article_supersession_link():
    old = Article(id="a1", number="TEST-ART-1", text="Old text.", superseded_by="a2")
    new = Article(id="a2", number="TEST-ART-1-BIS", text="New text.", supersedes="a1")
    assert old.superseded_by == new.id
    assert new.supersedes == old.id


def test_document_template_requires_review_model():
    with pytest.raises(ValidationError):
        DocumentTemplate(
            id="tmpl-1",
            name="Test Template",
            practice_area="marriage_family",
            fields=[],
            body_template="Test {{ field }}",
        )


def test_document_template_with_fields():
    template = DocumentTemplate(
        id="tmpl-1",
        name="Test Template",
        practice_area="marriage_family",
        review_model="per_instance",
        fields=[TemplateField(name="situation", label="Situation", field_type="textarea")],
        body_template="Test {{ situation }}",
    )
    assert template.lawyer_approved is False
    assert template.fields[0].required is True
