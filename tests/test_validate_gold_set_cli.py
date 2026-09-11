import json

from typer.testing import CliRunner

from mizan.cli.validate_gold_set import app

runner = CliRunner()

VALID_ENTRY = {
    "id": "test-qa-001",
    "practice_area": "marriage_family",
    "entry_type": "qa",
    "question": "Test question?",
    "answer": "Test answer.",
    "citations": [
        {"source_document": "TEST-STATUTE", "article_or_madda": "TEST-ART-1", "quoted_text": "Test."}
    ],
    "authored_by": "test-lawyer-a",
    "reviewed_by": "test-lawyer-b",
    "status": "approved",
    "difficulty": "routine",
}


def test_valid_file_exits_zero(tmp_path):
    path = tmp_path / "entry.json"
    path.write_text(json.dumps(VALID_ENTRY), encoding="utf-8")

    result = runner.invoke(app, [str(path)])

    assert result.exit_code == 0
    assert "[OK]" in result.stdout


def test_invalid_file_exits_nonzero(tmp_path):
    path = tmp_path / "entry.json"
    path.write_text(json.dumps({**VALID_ENTRY, "status": "not_a_real_status"}), encoding="utf-8")

    result = runner.invoke(app, [str(path)])

    assert result.exit_code != 0
    assert "[INVALID]" in result.stdout
