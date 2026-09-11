"""Clause-level chunking — technique #2 in the root CLAUDE.md.

"Chunk by article/madda boundaries, never a fixed token window." This
module implements the boundary-detection/splitting algorithm generically
over regex patterns for common heading styles (English "Article N", Arabic
"المادة N" / "المادة رقم N"), so it needs no real corpus or gold set to
exist — only applying it to a specific practice area's real ingested
documents is gated on that area's gold set (see "How to work in this repo"
in the root CLAUDE.md).
"""

from __future__ import annotations

import re

from mizan.schemas.documents import Article

DEFAULT_BOUNDARY_PATTERNS = [
    r"^Article\s+(\S+)",
    r"^المادة\s+(?:رقم\s+)?(\S+)",
]


def chunk_by_article_boundary(
    raw_text: str,
    *,
    boundary_patterns: list[str] | None = None,
) -> list[Article]:
    """Split raw document text into one Article per boundary match.

    Never falls back to a fixed token window. If no boundary pattern
    matches anywhere in the text, the whole text comes back as a single
    Article numbered "UNKNOWN" rather than being silently sliced at some
    arbitrary width — a caller can detect that case (len(result) == 1 and
    number == "UNKNOWN") and treat it as "this document needs a boundary
    pattern we don't have yet," instead of getting silently wrong chunks.
    """
    patterns = boundary_patterns or DEFAULT_BOUNDARY_PATTERNS
    combined = re.compile("|".join(f"(?:{p})" for p in patterns), re.MULTILINE)

    matches = list(combined.finditer(raw_text))
    if not matches:
        return [Article(id="chunk-0", number="UNKNOWN", text=raw_text.strip())]

    articles: list[Article] = []
    for i, match in enumerate(matches):
        number = next(group for group in match.groups() if group is not None)
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)
        articles.append(Article(id=f"chunk-{i}", number=number, text=raw_text[start:end].strip()))
    return articles
