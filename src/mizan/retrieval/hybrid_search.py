"""Hybrid retrieval fusion — technique #1 in the root CLAUDE.md.

"Hybrid retrieval, not embeddings alone — dense embeddings + BM25 with
reciprocal-rank fusion. Semantic search alone misses exact lookups like
'Article 74 of the Companies Law.'"

This module implements only the fusion step (Reciprocal Rank Fusion), which
is a pure, content-agnostic algorithm over two or more ranked ID lists — it
needs neither a real embedding model nor a real BM25 index nor any practice
area's gold set to exist. Building the actual dense/BM25 indexes over a real
corpus, and calling this to combine their results, is Phase 1+ work, gated
per practice area on that area's gold set (see "How to work in this repo"
in the root CLAUDE.md).
"""

from __future__ import annotations

DEFAULT_RRF_K = 60


def reciprocal_rank_fusion(
    ranked_lists: list[list[str]],
    *,
    k: int = DEFAULT_RRF_K,
) -> list[tuple[str, float]]:
    """Fuse N ranked lists of document/chunk IDs into one ranking.

    Each list is ordered best-to-worst by that retriever's own scoring
    (e.g. one dense-embedding ranking, one BM25 ranking). `k` is RRF's
    standard damping constant (60 is the commonly cited default — larger
    values flatten the influence of top ranks). An ID absent from a given
    list simply contributes nothing from that list, rather than being
    penalized. Returns (id, fused_score) pairs sorted best-to-worst.
    """
    scores: dict[str, float] = {}
    for ranked_list in ranked_lists:
        for rank, doc_id in enumerate(ranked_list, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)

    return sorted(scores.items(), key=lambda item: item[1], reverse=True)
