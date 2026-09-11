# Legal Assistant — Frontend (visualization pass)

> Internal repo name only — see the root `CLAUDE.md` for why "Mizan AI" is a
> working title, not settled branding, and must not appear in user-facing
> product copy.

Read `frontend-CLAUDE.md` (and the root `CLAUDE.md`) first — this is a
**visualization pass**: a real Next.js app running against a **mocked
backend** so the product shape can be clicked through before retrieval,
verification, and generation exist for real.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000/ar (Arabic default) or /en
```

## Test it

```bash
npx playwright install --with-deps chromium   # first time only
npm run test:e2e
```

`playwright.config.ts` starts `next dev` itself, so `npm run test:e2e` is
self-contained.

## How the mock backend works

Every "backend" call goes through a real Next.js Route Handler under
`src/app/api/*`, backed by the fixtures in `src/mocks/fixtures/`. Pages call
these through `src/lib/api/client.ts` + TanStack Query
(`src/lib/api/queries.ts`) using normal relative-path `fetch()`. Swapping to
the real FastAPI backend later is a `NEXT_PUBLIC_API_BASE_URL` config change,
not a rewrite.

## What's fake on purpose

- All citations (`src/mocks/fixtures/chat-answers.ts`, `review-queue.ts`) use
  an invented statute name ("Family Relations Statute (Demo Corpus)") and
  quoted text explicitly marked `[Illustrative sample — not real statutory
  language]`. None of it is real Saudi legal content — see the root
  `CLAUDE.md` anti-fabrication rule.
- The firm's real name/logo is a bracketed placeholder (`[Firm Name]` /
  `common.firmPlaceholder`) — the actual brand is not "Mizan AI" and is not
  yet settled.
- The marriage-documents flow always returns `pending_lawyer_review` as its
  real default (`src/app/api/documents/intake/route.ts`) — the
  `template_approved` state is only reachable through an explicitly-labeled
  demo toggle, never the default. This reflects the still-open regulatory
  blocking item in the root `CLAUDE.md`: document generation stays
  visibly gated until the partner confirms it in writing.

## Structure

- `src/app/[locale]/` — the three flows, behind `next-intl` locale routing
  (`ar` default, `en` secondary).
- `src/app/api/` — the mock backend.
- `src/components/{brand,chat,documents,review,layout,ui}/` — UI split by
  flow, plus a small hand-built `ui/` kit (shadcn conventions, Radix only for
  `tabs`/`dialog`).
- `src/types/` — TypeScript mirrors of the root brief's `pydantic` schemas
  (`GoldSetEntry`, `Citation`, etc.) — keep these in sync if those change.
- `tests/e2e/` — Playwright smoke tests for all three flows plus an RTL pass.
