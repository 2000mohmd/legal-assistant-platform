"""Citation-and-supersession graph — technique #4 in the root CLAUDE.md.

Tracks which provisions replaced which, so the system never confidently
cites a repealed article as current law. Pure graph traversal over whatever
Article records exist — content-agnostic, no gold set required to write.
Populating the graph from a real corpus is Phase 1+ ingestion work.
"""

from __future__ import annotations

from mizan.schemas.documents import Article


def is_current(article: Article) -> bool:
    """An article is current unless something explicitly supersedes it."""
    return article.superseded_by is None


def resolve_current_version(article: Article, articles_by_id: dict[str, Article]) -> Article:
    """Follow superseded_by links until reaching the current version.

    Raises rather than looping forever on a cycle, and raises rather than
    guessing on a dangling link — a malformed supersession graph must fail
    loudly, not silently return a plausible-looking wrong answer.
    """
    seen: set[str] = set()
    current = article
    while current.superseded_by is not None:
        if current.id in seen:
            raise ValueError(f"Supersession cycle detected starting at article '{article.id}'.")
        seen.add(current.id)

        next_article = articles_by_id.get(current.superseded_by)
        if next_article is None:
            raise KeyError(
                f"Article '{current.id}' claims to be superseded by "
                f"'{current.superseded_by}', which is not in the provided corpus."
            )
        current = next_article
    return current
