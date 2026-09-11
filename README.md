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
- **Retrieval, verification, council mode, citation graph** — the five
  techniques in root CLAUDE.md are Phase 1+; only the schemas and seams they
  need exist so far.

## Run it

Verified working: `uv` installs Python 3.11 itself (this machine had none),
so no separate Python setup is needed.

```bash
uv sync --extra dev
uv run pytest        # 21 passed
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
  cli/          # validate_gold_set.py
data/practice_areas/marriage_family/
  gold_set/     # empty — see Status above
  templates/    # empty — see Status above
tests/          # one test file per schema/module above
```
