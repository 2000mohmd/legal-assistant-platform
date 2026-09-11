# Legal Assistant — Backend Pipeline (Phase 0 skeleton)

> Read the root `CLAUDE.md` (in the parent `Downloads/` folder) first. This
> is Phase 0: repo structure and typed seams for retrieval, verification,
> generation, and document-assembly — not working retrieval/generation
> logic. Nothing here is gated open; document generation is disabled by
> default (`src/mizan/generation/document_assembly.py`) pending the
> partner's written regulatory confirmation.

This repo has two pieces:

- **This directory** (`src/mizan/`, `tests/`, `data/`) — the backend pipeline
  skeleton documented below.
- **`frontend/`** — the Next.js visualization pass (mocked backend, all three
  product flows). See [`frontend/README.md`](frontend/README.md). The two
  are not wired together yet: the frontend talks only to its own mock API
  routes, not to anything in `src/mizan/`.

## Status

Structure only, per the Phase 0 scope. Specifically NOT done yet, and not
fabricatable:

- **Gold sets** — `data/practice_areas/marriage_family/gold_set/` is empty.
  Real entries require 60–100+ Q&A pairs written and cross-reviewed by the
  firm's own senior lawyers (root CLAUDE.md Phase 0 DoD) — nothing here
  substitutes for that.
- **Real corpus** — no firm documents have been ingested; `ingestion/loader.py`
  will return `[]` until `data/practice_areas/<area>/corpus/*.json` exists.
- **Wiring any of the below to a real practice area** — the root brief's
  "How to work in this repo" section is explicit: no retrieval/generation
  code gets written *for a practice area* until that area's gold set exists
  and is reviewed. Marriage & family's doesn't yet, so nothing below is
  wired to real content.

Four of the five non-negotiable techniques already have real, tested
implementations, because their *algorithms* are content-agnostic and don't
need a gold set to exist — only applying them to a specific area's real
corpus does:

- `verification/citation_check.py` — the mechanical citation-verification
  pass (technique #3): checks a citation's source/article/quoted-text
  against a `SourceDocument`, always returns passed/flagged + a reason.
- `verification/supersession.py` — the citation-and-supersession graph
  (technique #4): resolves an article to its current version, raising
  loudly on cycles or dangling links rather than guessing.
- `retrieval/hybrid_search.py` — Reciprocal Rank Fusion (technique #1):
  combines ranked ID lists from a dense retriever and BM25.
- `council/orchestrator.py` — council-mode orchestration (technique #5):
  calls N models on the same prompt and flags disagreement.

Still Phase 1+ (need a real corpus/gold set to mean anything): actually
building the dense-embedding + BM25 indexes that feed `hybrid_search`,
deciding which real marriage_family questions are "high-stakes" enough to
route through `run_council`, and clause-level chunking of a real corpus
(technique #2 — the `Article` model already exists for this, but nothing
populates it from real documents yet).

## Run it

Verified working: `uv` installs Python 3.11 itself (this machine had none),
so no separate Python setup is needed.

```bash
uv sync --extra dev
uv run pytest        # 44 passed
uv run ruff check .  # clean
uv run validate-gold-set data/practice_areas/marriage_family/gold_set/*.json
```

`ANTHROPIC_API_KEY` must be set in the environment before `ClaudeClient` can
make a real call (it is not needed to run the test suite — no test calls
the real API).

## Layout

```
src/mizan/
  schemas/      # gold_set, documents, templates — pydantic models only
  ingestion/    # redact.py (PII seam, placeholder), loader.py
  generation/   # claude_client.py (thin SDK wrapper), document_assembly.py (gated)
  verification/ # citation_check.py, supersession.py — real, tested, content-agnostic
  retrieval/    # hybrid_search.py (RRF fusion) — real, tested, content-agnostic
  council/      # orchestrator.py (council mode) — real, tested, content-agnostic
  cli/          # validate_gold_set.py
data/practice_areas/marriage_family/
  gold_set/     # empty — see Status above
  templates/    # empty — see Status above
tests/          # one test file per schema/module above
```
