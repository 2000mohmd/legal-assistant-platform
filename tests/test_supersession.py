import pytest

from mizan.schemas.documents import Article
from mizan.verification.supersession import is_current, resolve_current_version


def test_is_current_true_when_not_superseded():
    article = Article(id="a1", number="TEST-ART-1", text="Text.")
    assert is_current(article) is True


def test_is_current_false_when_superseded():
    article = Article(id="a1", number="TEST-ART-1", text="Text.", superseded_by="a2")
    assert is_current(article) is False


def test_resolve_current_version_follows_chain():
    a1 = Article(id="a1", number="TEST-ART-1", text="Old.", superseded_by="a2")
    a2 = Article(
        id="a2", number="TEST-ART-1-BIS", text="Newer.", superseded_by="a3", supersedes="a1"
    )
    a3 = Article(id="a3", number="TEST-ART-1-TER", text="Current.", supersedes="a2")
    by_id = {"a1": a1, "a2": a2, "a3": a3}

    assert resolve_current_version(a1, by_id).id == "a3"


def test_resolve_current_version_returns_self_when_already_current():
    a1 = Article(id="a1", number="TEST-ART-1", text="Current.")
    assert resolve_current_version(a1, {"a1": a1}).id == "a1"


def test_resolve_current_version_raises_on_dangling_link():
    a1 = Article(id="a1", number="TEST-ART-1", text="Old.", superseded_by="does-not-exist")
    with pytest.raises(KeyError):
        resolve_current_version(a1, {"a1": a1})


def test_resolve_current_version_raises_on_cycle():
    a1 = Article(id="a1", number="TEST-ART-1", text="A.", superseded_by="a2")
    a2 = Article(id="a2", number="TEST-ART-2", text="B.", superseded_by="a1")
    with pytest.raises(ValueError, match="cycle"):
        resolve_current_version(a1, {"a1": a1, "a2": a2})
