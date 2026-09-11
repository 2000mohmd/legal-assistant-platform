import pytest

from mizan.council.orchestrator import run_council


def test_agreement_when_models_say_the_same_thing():
    models = {
        "model-a": lambda prompt: "The answer is X.",
        "model-b": lambda prompt: "the   answer is x.",
    }
    result = run_council("test prompt", models)
    assert result.disagreement is False
    assert len(result.responses) == 2


def test_disagreement_when_models_say_different_things():
    models = {
        "model-a": lambda prompt: "The answer is X.",
        "model-b": lambda prompt: "The answer is Y.",
    }
    result = run_council("test prompt", models)
    assert result.disagreement is True
    assert "disagreed" in result.note


def test_requires_at_least_two_models():
    with pytest.raises(ValueError, match="at least two"):
        run_council("test prompt", {"model-a": lambda prompt: "Answer."})


def test_all_models_are_called_with_the_same_prompt():
    seen_prompts = []

    def recording_model(prompt: str) -> str:
        seen_prompts.append(prompt)
        return "same answer"

    models = {"model-a": recording_model, "model-b": recording_model}
    run_council("shared prompt", models)
    assert seen_prompts == ["shared prompt", "shared prompt"]
