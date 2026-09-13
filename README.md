# Legal Assistant — Backend Pipeline

> Read the root `CLAUDE.md` (in the parent `Downloads/` folder) first.
> Document assembly's *rendering logic* is real (Jinja templating), but
> `DOCUMENT_GENERATION_ENABLED = False` in
> `src/mizan/generation/document_assembly.py` means it never actually runs
> until the partner's written regulatory confirmation lands, and even then
> only for template-level, lawyer-approved templates. That gate is
> unrelated to and unaffected by everything below — chat and document
> generation are different features with different regulatory postures.

This repo has three pieces:

- **This directory** (`src/mizan/`, `tests/`, `data/`) — the backend
  pipeline, documented below. Now includes a real FastAPI HTTP service
  (`src/mizan/api/`), not just importable library functions.
- **`frontend/`** — the Next.js app. See [`frontend/README.md`](frontend/README.md)
  — real Supabase auth/database wiring, verified live end to end
  (14/14 Playwright, 10/10 Vitest, against an actually-running local
  Supabase). Can now optionally call this backend for real chat answers
  (see "Wiring the frontend to this backend" below) — off by default.
- **`supabase/`** — the database schema (migrations) and demo seed data
  backing the frontend's real accounts/persistence.

## Status

All five non-negotiable techniques have real, tested implementations, and
as of this pass they're wired together into an actual answer pipeline —
not just five separate library functions:

- `ingestion/chunking.py` (technique #2) — splits raw text into one chunk
  per article/madda boundary (regex, English + Arabic heading styles).
- `retrieval/bm25_index.py` (technique #1, keyword half) — real BM25
  search over a corpus's articles. Candidacy is decided by literal
  (non-stopword) token overlap, not by BM25 score sign: confirmed live
  that BM25's IDF term lands on exactly zero for a query term appearing in
  roughly half of a *small* corpus — the normal case for a fledgling real
  dataset, not just tiny test fixtures — which silently dropped genuine
  matches under a naive `score > 0` filter.
- `retrieval/hybrid_search.py` (technique #1, fusion half) — Reciprocal
  Rank Fusion combining a dense-retriever list and the BM25 list above.
  Dense embedding retrieval itself is still not implemented — it needs a
  hosted embeddings API or a local model, a real cost/infra decision, not
  something to default into.
- `verification/citation_check.py` (technique #3) — mechanical citation
  verification: checks a citation's source/article/quoted-text against a
  `SourceDocument`, always returns passed/flagged + a reason.
- `verification/supersession.py` (technique #4) — resolves an article to
  its current version, raising loudly on cycles or dangling links.
- `council/orchestrator.py` (technique #5) — calls N models on the same
  prompt and flags disagreement (exact-match after normalization — a
  deliberately high bar, so it over-flags rather than under-flags).
- `generation/answer_pipeline.py` — **wires the above together**:
  retrieve -> ask the model to answer using ONLY the retrieved excerpts,
  in a fixed JSON shape -> mechanically verify every claimed citation
  against what was actually retrieved. If nothing is retrieved, it
  refuses to call the model at all rather than let it guess ungrounded —
  the anti-hallucination principle applied one level above the citation
  check alone. Fully unit-tested with a fake completion function; no API
  key or real corpus needed to verify the orchestration itself is correct.
- `api/` — a real FastAPI service exposing `POST /v1/chat`, audit-logging
  every query/retrieval/generation step (root CLAUDE.md non-negotiable,
  PII-redacted before logging) and returning a clean 503 rather than a raw
  traceback when the model call fails (confirmed live: an unconfigured
  `ANTHROPIC_API_KEY` raises deep inside the `anthropic` SDK's
  request-building code, not at client construction).
- `cli/ingest_corpus.py` — turns a raw text file into the
  `data/practice_areas/<area>/corpus/*.json` shape `ingestion/loader.py`
  reads. This is the literal entry point for a real dataset.

**Still not done, and not fabricatable:**

- **Gold sets** — `data/practice_areas/marriage_family/gold_set/` is
  empty. Real entries require 60–100+ Q&A pairs written and cross-reviewed
  by the firm's own senior lawyers (root CLAUDE.md Phase 0 DoD).
- **Real corpus** — no firm documents have been ingested. The ingestion
  CLI above is ready to receive one; nothing has been run against it here.
- **Wiring any of this to a real, live practice area** — the root brief's
  "How to work in this repo" section is explicit: no retrieval/generation
  code runs *for a practice area* until that area's gold set exists and
  is reviewed. Everything above is real, tested infrastructure that a
  reviewed gold set plugs into — it is not itself a decision to go live.
  The frontend integration (below) reflects this: off by default.
- **Dense embedding retrieval, real cross-vendor council mode** — both
  need real infra/cost decisions (which embeddings provider; a second
  model vendor's client alongside `ClaudeClient`) that weren't made here.

## Run it

```bash
uv sync --extra dev
uv run pytest         # 69 passed
uv run ruff check .   # clean
uv run validate-gold-set data/practice_areas/marriage_family/gold_set/*.json
uv run ingest-corpus marriage_family "Some Statute" statute path/to/raw.txt
uv run uvicorn mizan.api.main:app --reload --port 8000
```

`ANTHROPIC_API_KEY` must be set in the environment before a `/v1/chat`
request that actually retrieves something will succeed — it is not needed
to run the test suite, start the server, or query a practice area with no
corpus yet (that path is designed to never construct a model client at
all, confirmed by a test that explicitly unsets the key).

## Wiring the frontend to this backend

`frontend/src/app/api/chat/route.ts` calls this service instead of its
fixture lookup when `MIZAN_BACKEND_URL` is set (e.g.
`http://127.0.0.1:8000`) — unset by default, matching
`DOCUMENT_GENERATION_ENABLED`'s pattern for the same reason: the gold-set
review gate above, not a missing feature. Verified live end to end with
this on: a matching-but-ungenerable question (real corpus hit, no API
key) fell back to the fixture path cleanly; a genuinely unmatched question
correctly got the real "not enough verified information" refusal instead
of a fixture answer, rather than either case breaking the chat UI.

## Layout

```
src/mizan/
  schemas/       # gold_set, documents, templates — pydantic models only
  ingestion/     # redact.py (PII seam), loader.py, chunking.py — real, tested
  generation/    # claude_client.py, answer_pipeline.py (real orchestration),
                 # document_assembly.py (real Jinja rendering, hard-gated closed)
  verification/  # citation_check.py, supersession.py — real, tested
  retrieval/     # bm25_index.py, hybrid_search.py — real, tested
  council/       # orchestrator.py — real, tested
  api/           # FastAPI service: main.py, routes/chat.py
  audit.py       # structured, PII-redacted audit logging
  cli/           # validate_gold_set.py, ingest_corpus.py
data/practice_areas/marriage_family/
  gold_set/      # empty — see Status above
  templates/     # empty — see Status above
tests/           # one test file per schema/module above, plus API-level tests
```
