"""BM25 keyword retrieval — the other half of technique #1 in the root
CLAUDE.md ("dense embeddings + BM25 with reciprocal-rank fusion").

`hybrid_search.py` already implements the fusion step, but fusing needs two
ranked lists, and until now nothing produced either one. This module
produces the keyword-search list: a real BM25 index over whatever
Article chunks exist for a practice area. Dense embedding retrieval is
still not implemented — it needs a hosted embeddings API or a local model,
both real infrastructure decisions (cost, which provider, where it runs)
rather than something to default into. Until that exists, `search()` here
is the whole retrieval story, not one half of a fusion.

Deliberately no persistence/caching: rebuilding a BM25 index over a small
per-practice-area corpus is cheap relative to a network round trip, and
skipping a cache layer means there's no cache-invalidation bug to have
here at all.
"""

from __future__ import annotations

import re

from rank_bm25 import BM25Okapi

from mizan.schemas.documents import Article, SourceDocument

_TOKEN_RE = re.compile(r"\w+", re.UNICODE)

# Deliberately minimal, not a linguistically complete stopword list (real
# Arabic stopword handling needs morphological analysis — prefixes/suffixes
# attach to the root, e.g. المادة vs بالمادة — which is out of scope for a
# day-one retriever). This exists solely to keep _tokenize()'s output from
# making trivial function words look like a topical match in the candidacy
# check below: without it, "What is the capital of France?" registered as a
# hit against an unrelated article purely because both contained "the" —
# confirmed live.
_STOPWORDS = frozenset(
    {
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "of", "in", "on",
        "to", "for", "and", "or", "with", "this", "that", "it", "as", "by", "at",
        "من", "في", "على", "إلى", "عن", "هذا", "هذه", "التي", "الذي", "و", "أو",
    }
)


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _meaningful_tokens(tokens: list[str]) -> set[str]:
    return {t for t in tokens if t not in _STOPWORDS}


class Bm25Index:
    """A BM25 index over the articles in a corpus, keyed by article id."""

    def __init__(self, corpus: list[SourceDocument]):
        self._articles: list[tuple[SourceDocument, Article]] = [
            (doc, article) for doc in corpus for article in doc.articles
        ]
        self._article_tokens = [_tokenize(article.text) for _, article in self._articles]
        # BM25Okapi raises on an empty corpus; treat "nothing to index" as a
        # valid, queryable-but-always-empty state rather than an error, since
        # "no corpus yet" is the expected condition before real data lands.
        self._bm25 = BM25Okapi(self._article_tokens) if self._article_tokens else None

    def search(self, query: str, top_k: int = 5) -> list[tuple[SourceDocument, Article, float]]:
        """Return up to top_k (document, article, score) tuples, best first."""
        if self._bm25 is None:
            return []

        query_tokens = _meaningful_tokens(_tokenize(query))
        if not query_tokens:
            return []

        # Candidacy is decided by literal (non-stopword) token overlap, not
        # by a BM25 score threshold: BM25's IDF term is exactly zero (or
        # negative) whenever a query term appears in roughly half the
        # corpus, which is the norm for a small/fledgling real corpus, not
        # just tiny test fixtures — confirmed live, a 2-article fixture
        # returned zero hits for an exact-word match under a `score > 0`
        # filter. BM25 score still decides ranking among candidates; it
        # just isn't trusted as a relevance gate on its own.
        candidate_indices = [
            i
            for i, tokens in enumerate(self._article_tokens)
            if query_tokens & _meaningful_tokens(tokens)
        ]
        if not candidate_indices:
            return []

        scores = self._bm25.get_scores(list(query_tokens))
        ranked = sorted(candidate_indices, key=lambda i: scores[i], reverse=True)[:top_k]
        return [(self._articles[i][0], self._articles[i][1], float(scores[i])) for i in ranked]
