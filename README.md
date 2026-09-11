# Legal Assistant — Backend Pipeline (Phase 0 skeleton)

> Read the root `CLAUDE.md` (in the parent `Downloads/` folder) first. This
> is Phase 0: repo structure and typed seams for retrieval, verification,
> generation, and document-assembly. Nothing here is gated open: document
> assembly's *rendering logic* is real (Jinja templating), but
> `DOCUMENT_GENERATION_ENABLED = False` in
> `src/mizan/generation/document_assembly.py` means it never actually runs
> until the partner's written regulatory confirmation lands, and even then
> only for template-level, lawyer-approved templates.

This repo has three pieces:

- **This directory** (`src/mizan/`, `tests/`, `data/`) — the backend pipeline
  skeleton documented below.
- **`frontend/`** — the Next.js app. See [`frontend/README.md`](frontend/README.md)
  — read its "Current status" section first, since it now has real
  Supabase auth/database wiring that is code-complete but not yet
  runtime-verified (this machine has no Docker). This is separate from
  `src/mizan/`: the frontend talks to Supabase directly for accounts/data,
  not to anything in `src/mizan/` — the AI/legal content it shows is still
  fixture data either way, pending real gold-set content.
- **`supabase/`** — the database schema (migrations) and demo seed data
  backing the frontend's real accounts/persistence.

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

All five non-negotiable techniques now have real, tested implementations of
their content-agnostic *algorithms* — only applying them to a specific
area's real corpus needs that area's gold set:

- `ingestion/chunking.py` — clause-level chunking (technique #2): splits
  raw text into one chunk per article/madda boundary (regex, English +
  Arabic heading styles), never a fixed token window; falls back to a
  single "UNKNOWN"-numbered chunk (never a silent wrong split) when no
  boundary pattern matches.
- `retrieval/hybrid_search.py` — Reciprocal Rank Fusion (technique #1):
  combines ranked ID lists from a dense retriever and BM25.
- `verification/citation_check.py` — the mechanical citation-verification
  pass (technique #3): checks a citation's source/article/quoted-text
  against a `SourceDocument`, always returns passed/flagged + a reason.
- `verification/supersession.py` — the citation-and-supersession graph
  (technique #4): resolves an article to its current version, raising
  loudly on cycles or dangling links rather than guessing.
- `council/orchestrator.py` — council-mode orchestration (technique #5):
  calls N models on the same prompt and flags disagreement.

Still Phase 1+ (need a real corpus/gold set to mean anything): actually
building the dense-embedding + BM25 indexes that feed `hybrid_search`,
deciding which real marriage_family questions are "high-stakes" enough to
route through `run_council`, and running `chunking.py` against a real
ingested corpus instead of test fixtures.

## Run it

Verified working: `uv` installs Python 3.11 itself (this machine had none),
so no separate Python setup is needed.

```bash
uv sync --extra dev
uv run pytest        # 54 passed
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
  ingestion/    # redact.py (PII seam, placeholder), loader.py, chunking.py (real, tested)
  generation/   # claude_client.py (thin SDK wrapper), document_assembly.py (real Jinja rendering, hard-gated closed)
  verification/ # citation_check.py, supersession.py — real, tested, content-agnostic
  retrieval/    # hybrid_search.py (RRF fusion) — real, tested, content-agnostic
  council/      # orchestrator.py (council mode) — real, tested, content-agnostic
  cli/          # validate_gold_set.py
data/practice_areas/marriage_family/
  gold_set/     # empty — see Status above
  templates/    # empty — see Status above
tests/          # one test file per schema/module above
```
