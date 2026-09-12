# Legal Assistant — Frontend

> Internal repo name only — see the root `CLAUDE.md` for why "Mizan AI" is a
> working title, not settled branding, and must not appear in user-facing
> product copy.

Originally built as a mocked "visualization pass" (`frontend-CLAUDE.md`).
Since then, real authentication and a real database (Supabase) were added
so the platform is actually usable end to end — **the AI/legal content
itself is still mock/fixture data**, by design, until real gold-set content
exists (see root `CLAUDE.md`).

## ⚠️ Current status: code-complete, NOT runtime-verified

Docker is not installed on the machine this was built on, and local
Supabase (`supabase start`) requires it. Every file below compiles and
type-checks (`npm run build` passes), but **nothing involving real
auth/database calls has actually been run once, end to end.** Treat the
auth flow, the RLS policies, and the Supabase-backed API routes as
reviewed-but-untested until someone runs the steps below for real.

### To actually verify this (do this first)

1. Install Docker Desktop (needs WSL2 on Windows) and make sure it's running.
2. From the repo root (not `frontend/`): `supabase start` — first run pulls
   several GB of images and takes a while. It prints a Studio URL, API URL,
   and keys; `frontend/.env.local` already has the correct values for an
   unmodified `supabase/config.toml`, so no copying needed unless you
   changed something.
3. `npm install && npm run dev` from `frontend/`.
4. Visit `/ar` or `/en`. Sign in via magic link (check the local email
   inbox at `http://127.0.0.1:54324` — Supabase's local Mailpit — since
   there's no real mail server in local dev).
5. To reach `/review`, sign in as `lawyer@test.local` (seeded in
   `supabase/seed.sql` with `profiles.role = 'lawyer'`) — same magic-link
   flow, same local inbox.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000/ar (Arabic default) or /en
```

Requires local Supabase running (see above) for anything beyond the home
page shell — practice areas, chat, documents, and review all make real
Supabase calls now.

## Test it

```bash
npm run test:unit   # Vitest — no Supabase needed, actually verified: 10/10 passing
npx playwright install --with-deps chromium   # first time only
npm run test:e2e    # needs local Supabase running — see caveat below
```

`test:unit` covers logic that doesn't need a live Supabase connection
(`src/lib/api/review-mapper.ts`'s DB-row-to-`ReviewItem` mapping,
`src/lib/supabase/fetch-with-timeout.ts`) and is the one test command in
this repo that's actually been run and confirmed green on this machine.

**Also unverified**: the specs in `tests/e2e/` that touch `/marriage/*` or
`/review` now sign in for real via `tests/e2e/helpers/auth.ts`, which
drives the actual magic-link flow through Supabase's local Mailpit REST
API. That helper was written against Mailpit's documented API shape but
has never actually been run — same Docker blocker as above. The RTL
dir/lang checks and the home-page/locale-toggle tests don't need auth and
should work regardless.

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
  = "force-dynamic"` so the check runs per-request, never baked into a
  static build.
- **Data**: `practice_areas`, `chat_sessions`/`chat_messages`,
  `document_requests`, `review_items`/`audit_events` — all real tables with
  RLS (see the migration). The home dashboard and review console now read
  real rows; chat and document intake persist real rows tied to
  `auth.uid()`. **The AI/legal content inside those rows is still
  fixture-based** (`src/mocks/fixtures/{chat-answers,document-conditions}.ts`)
  — persistence is real, generation is not.
- **Known non-issue once Supabase is actually running**: with Supabase
  unreachable on this machine, `@supabase/supabase-js` itself takes ~7-8s
  to report `ECONNREFUSED` (confirmed in a bare Node script, nothing to do
  with this app's code) — internal client-library retry/backoff, not a
  hanging fetch. `src/lib/supabase/fetch-with-timeout.ts` guards against a
  genuinely hanging connection instead (e.g. a firewall black-holing
  packets), which is a different failure mode. Once Supabase is reachable
  there's nothing to retry, so this resolves itself.
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
- `tests/e2e/` — Playwright specs; see the verification caveat above.
- `../supabase/` — migrations + seed data (repo root, shared infra, not
  frontend-specific).
