-- Phase 0 -> real-platform schema.
--
-- Scope note: this stores real auth identities (email) and real user
-- activity once deployed for real users. Per the root CLAUDE.md
-- Non-Negotiables, that requires a PDPL assessment and a settled data-
-- residency decision before any real (non-test) user signs up against a
-- production project. Nothing below enforces that decision technically —
-- it's a product/legal call, not a schema constraint.
--
-- All demo content seeded against this schema (see seed.sql) uses the same
-- fabricated TEST-*/demo identifiers as the rest of the repo — never real
-- Saudi legal text.

-- ---------------------------------------------------------------------
-- profiles: one row per auth.users row, added automatically by trigger.
-- role gates access to the internal /review console (lawyer only).
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'client' check (role in ('client', 'lawyer')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created (magic
-- link signup). New users default to 'client'; promotion to 'lawyer' is a
-- manual, deliberate action (see seed.sql for the local-dev test lawyer),
-- never a self-service signup option.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used by policies below: is the current user a lawyer?
create function public.is_lawyer()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'lawyer'
  );
$$;

-- ---------------------------------------------------------------------
-- practice_areas: the home-dashboard tiles. Public read (even for
-- signed-out visitors browsing what's on offer); no public write.
-- ---------------------------------------------------------------------
create table public.practice_areas (
  slug text primary key,
  name_ar text not null,
  name_en text not null,
  description_ar text not null,
  description_en text not null,
  status text not null default 'coming_soon' check (status in ('live', 'coming_soon')),
  href text,
  sort_order int not null default 0
);

alter table public.practice_areas enable row level security;

create policy "practice_areas: public read" on public.practice_areas
  for select using (true);

-- ---------------------------------------------------------------------
-- chat_sessions / chat_messages: real chat history per signed-in user.
-- The assistant's *content* is still mock/fixture-based (no real AI
-- wiring yet) — only the persistence layer is real.
-- ---------------------------------------------------------------------
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  practice_area text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions: owner read" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "chat_sessions: owner insert" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  citations jsonb not null default '[]'::jsonb,
  verification text check (verification in ('verified', 'flagged')),
  difficulty text check (difficulty in ('routine', 'moderate', 'high_stakes')),
  council_note text,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_messages: owner read" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );

create policy "chat_messages: owner insert" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- document_requests: marriage-document intake + drafted output, per user.
-- review_state defaults to pending_lawyer_review and nothing in this
-- schema ever flips it automatically — see src/mizan's
-- DOCUMENT_GENERATION_ENABLED gate for why that default must not move
-- without the regulatory confirmation.
-- ---------------------------------------------------------------------
create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  situation text not null,
  desired_conditions text not null,
  relevant_facts text,
  review_state text not null default 'pending_lawyer_review'
    check (review_state in ('pending_lawyer_review', 'template_approved')),
  review_model text not null default 'per_instance'
    check (review_model in ('per_instance', 'template_level')),
  conditions jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

alter table public.document_requests enable row level security;

create policy "document_requests: owner read" on public.document_requests
  for select using (auth.uid() = user_id);

create policy "document_requests: owner insert" on public.document_requests
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- review_items / audit_events: the internal /review console's queue.
-- Lawyer-only, enforced via is_lawyer() rather than client-side trust.
-- ---------------------------------------------------------------------
create table public.review_items (
  id text primary key,
  practice_area text not null,
  entry_type text not null check (entry_type in ('qa', 'document_generation')),
  submitted_at timestamptz not null default now(),
  difficulty text not null check (difficulty in ('routine', 'moderate', 'high_stakes')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'edited_approved', 'rejected')),
  question text not null,
  ai_draft text not null,
  edited_draft text,
  citation_checks jsonb not null default '[]'::jsonb
);

alter table public.review_items enable row level security;

create policy "review_items: lawyer read" on public.review_items
  for select using (public.is_lawyer());

create policy "review_items: lawyer update" on public.review_items
  for update using (public.is_lawyer());

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  review_item_id text not null references public.review_items (id) on delete cascade,
  reviewer text not null,
  action text not null check (action in ('submitted', 'approved', 'edited_approve', 'rejected')),
  occurred_at timestamptz not null default now(),
  note text
);

alter table public.audit_events enable row level security;

create policy "audit_events: lawyer read" on public.audit_events
  for select using (public.is_lawyer());

create policy "audit_events: lawyer insert" on public.audit_events
  for insert with check (public.is_lawyer());
