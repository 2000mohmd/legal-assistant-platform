# Legal Assistant — Frontend

> Internal repo name only — see the root `CLAUDE.md` for why "Mizan AI" is a
> working title, not settled branding, and must not appear in user-facing
> product copy.

Originally built as a mocked "visualization pass" (`frontend-CLAUDE.md`).
Since then, real authentication and a real database (Supabase) were added
so the platform is actually usable end to end — **the AI/legal content
itself is still mock/fixture data**, by design, until real gold-set content
exists (see root `CLAUDE.md`).

## ✅ Status: verified live end to end

Local Supabase (Docker + `supabase start`) has actually been run on this
machine, and the full stack has been exercised for real — not just built:
new-user magic-link signup, existing-user (seeded lawyer) sign-in, session
persistence, route protection, role-based authorization, RLS enforcement,
chat/document persistence, and the review approve/edit/reject actions with
correctly-attributed audit trails. `npm run test:unit` (10/10) and
`npx playwright test` (**14/14**) both pass against a real running stack.

None of that was true on the first attempt. Several real bugs surfaced
only by actually running this, each fixed and left documented in place
(the git history and inline comments name each one) rather than smoothed
over:

- The CLI's *default* magic-link email template pointed at Supabase's own
  verify endpoint, not this app's `/auth/confirm` route — the email would
  send, but the link in it would never reach the app. Fixed via
  `supabase/config.toml`'s `[auth.email.template.magic_link]` override.
- `additional_redirect_urls` didn't list the actual origins in use (wrong
  scheme, missing the Playwright port) — GoTrue silently drops a
  non-allow-listed `redirect_to` rather than erroring, so this failed
  quietly until traced through Mailpit's actual email content.
- The seeded `lawyer@test.local` row left several `auth.users` columns
  NULL; GoTrue's Go code can't scan NULL into those fields, producing a
  generic "Database error finding user" on every sign-in attempt for that
  account specifically. Fixed in `supabase/seed.sql` (empty strings, not
  NULL).
- `chat_messages` bulk-insert silently failed
  (`23502 null value in column "citations"`): PostgREST sends an explicit
  NULL for a key missing from one row in a batch insert, rather than
  falling back to that column's default, once the batch's rows have
  inconsistent keys. Fixed in `src/app/api/chat/route.ts`.
- The Playwright auth helper generated a *stable* test email per test case
  (`testInfo.testId` looked like a good random ID; it isn't — it's a fixed
  ID for that named test). Since Mailpit keeps history, repeated runs
  accumulated multiple emails at the same address, and the helper could
  grab a stale, already-used token. Fixed by generating a truly unique
  address per invocation, and — for the one address that's deliberately
  shared (`lawyer@test.local`) — by diffing Mailpit message IDs
  before/after sending instead of trusting timestamp order (two emails to
  the same address moments apart can tie on Mailpit's second-granularity
  timestamps). Both in `tests/e2e/helpers/auth.ts`.
- That same helper's form selectors matched only the English label/button
  text (`getByLabel(/email/i)`, `/send/i)`) — 100% reproducible failure on
  the one test that signs in under the Arabic locale, since neither
  regex ever matches the Arabic copy. Fixed with locale-independent
  `id`/`type` selectors.

## Run it

```bash
supabase start   # from the repo root — needs Docker running
npm install
npm run dev      # http://localhost:3000/ar (Arabic default) or /en
```

`frontend/.env.local` already has the correct local values (confirmed to
match what `supabase start` actually prints, not just assumed). Sign in via
magic link; check `http://127.0.0.1:54324` (Mailpit) for the email — there's
no real mail server in local dev. To reach `/review`, sign in as
`lawyer@test.local` (seeded with `profiles.role = 'lawyer'`), same flow,
same local inbox.

If `supabase start` fails claiming Docker/WSL2 can't start: on Windows this
usually means hardware virtualization is disabled in BIOS/UEFI firmware
settings (Intel VT-x / AMD-V) — a firmware toggle, not a Windows setting;
enabling it needs a restart into BIOS during boot.

## Test it

```bash
npm run test:unit   # Vitest, no Supabase needed — 10/10 passing
npx playwright install --with-deps chromium   # first time only
npm run test:e2e    # needs local Supabase running — 14/14 passing
```

Playwright's specs under `/marriage/*` and `/review` sign in for real via
`tests/e2e/helpers/auth.ts`, which drives the actual magic-link flow
through Mailpit's REST API. Local Supabase has no data reset between test
runs, so re-running the suite repeatedly against the same database
eventually consumes the 3 seeded `review_items` rows (all become
approved/rejected) — run `supabase db reset` from the repo root first if
`review.spec.ts` starts failing on "no pending item to act on."

## Auth & data model

- **Auth**: Supabase magic-link (passwordless) for both client users and
  lawyers — same flow, gated afterward by role. See
  `src/lib/supabase/{client,server,middleware}.ts`, `src/app/[locale]/login/`,
  `src/app/auth/confirm/route.ts`.
- **Authorization**: a `profiles` table (`role: 'client' | 'lawyer'`,
  auto-created on signup via a Postgres trigger — see
  `supabase/migrations/0001_init.sql`) gates `/review`. New signups always
  default to `client`; promotion to `lawyer` is a manual DB action, never
  self-service.
- **Route protection**: `(client)/marriage/layout.tsx` and `review/layout.tsx`
  redirect signed-out visitors to `/login`; both are `export const dynamic
  = "force-dynamic"` so the check runs per-request — confirmed via the
  actual `.next` build output, not just the build summary table, which
  turned out to mislabel these routes as static.
- **Data**: `practice_areas`, `chat_sessions`/`chat_messages`,
  `document_requests`, `review_items`/`audit_events` — all real tables with
  RLS (see the migration), confirmed live: anon reads are correctly
  blocked on lawyer-only tables, and reads/writes are correctly scoped to
  `auth.uid()` elsewhere. The home dashboard and review console read real
  rows; chat and document intake persist real rows tied to the signed-in
  user. **The AI/legal content inside those rows is still fixture-based**
  (`src/mocks/fixtures/{chat-answers,document-conditions}.ts`) —
  persistence is real, generation is not.
- **PDPL note**: this now stores real emails/sessions for anyone who signs
  up. The root `CLAUDE.md` non-negotiables require a PDPL assessment and
  data-residency decision before real (non-test) users are onboarded — that
  hasn't happened. Local dev / your own test accounts are fine; don't point
  this at a production Supabase project with real signups yet.

## What's fake on purpose

- All citations (`src/mocks/fixtures/chat-answers.ts`, `supabase/seed.sql`)
  use an invented statute name ("Family Relations Statute (Demo Corpus)")
  and quoted text explicitly marked `[Illustrative sample — not real
  statutory language]`. None of it is real Saudi legal content — see the
  root `CLAUDE.md` anti-fabrication rule.
- The firm's real name/logo is a bracketed placeholder (`[Firm Name]` /
  `common.firmPlaceholder`) — the actual brand is not "Mizan AI" and is not
  yet settled.
- The marriage-documents flow always persists+returns
  `pending_lawyer_review` as its real default
  (`src/app/api/documents/intake/route.ts`) — `template_approved` is only
  reachable through an explicitly-labeled demo toggle, never the default.
  Reflects the still-open regulatory blocking item in the root `CLAUDE.md`.
- Chat answers are keyword-matched fixtures (`src/app/api/chat/route.ts`),
  not real retrieval or a real Claude call — `generation/claude_client.py`
  in the backend exists but nothing invokes it from here yet.

## Structure

- `src/app/[locale]/(client)/` — home + marriage flows, real Supabase auth
  required for marriage/*.
- `src/app/[locale]/review/` — internal console, real auth + lawyer-role gate.
- `src/app/auth/confirm/route.ts` — magic-link landing target (outside
  `[locale]` on purpose — see the middleware matcher).
- `src/app/api/` — Route Handlers, now backed by real Supabase queries
  (practice-areas, review) or Supabase persistence + fixture content
  (chat, documents).
- `src/lib/supabase/` — browser/server/middleware Supabase client setup.
- `src/components/{brand,chat,documents,review,layout,ui}/` — UI split by
  flow, plus a small hand-built `ui/` kit (shadcn conventions, Radix only
  for `tabs`/`dialog`).
- `src/types/` — TypeScript mirrors of the root brief's `pydantic` schemas
  (`GoldSetEntry`, `Citation`, etc.) — keep these in sync if those change.
- `tests/e2e/` — Playwright specs, all passing against a real local stack.
- `../supabase/` — migrations + seed data (repo root, shared infra, not
  frontend-specific).
