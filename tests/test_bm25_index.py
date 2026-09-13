from mizan.retrieval.bm25_index import Bm25Index
from mizan.schemas.documents import Article, SourceDocument

CORPUS = [
    SourceDocument(
        id="test-doc-1",
        title="TEST-STATUTE",
        practice_area="marriage_family",
        document_type="statute",
        articles=[
            Article(id="a1", number="TEST-ART-1", text="A dowry may be paid upfront or deferred."),
            Article(
                id="a2", number="TEST-ART-2", text="Custody follows the child's best interest."
            ),
        ],
    )
]


def test_empty_corpus_returns_no_hits():
    assert Bm25Index([]).search("dowry") == []


def test_finds_the_article_containing_the_query_terms():
    hits = Bm25Index(CORPUS).search("dowry deferred")
    assert len(hits) == 1
    doc, article, score = hits[0]
    assert article.number == "TEST-ART-1"
    # Not `score > 0`: BM25's IDF term legitimately lands on exactly 0.0 in
    # a corpus this small (see the module docstring/comment) — candidacy,
    # not score sign, is what proves this matched.


def test_query_with_no_matching_terms_returns_no_hits():
    assert Bm25Index(CORPUS).search("unrelated query about spacecraft") == []


def test_respects_top_k():
    hits = Bm25Index(CORPUS).search("dowry OR custody", top_k=1)
    assert len(hits) <= 1
