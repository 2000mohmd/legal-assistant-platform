-- Closes the loop between a client submitting a document request and a
-- lawyer actually seeing it.
--
-- Before this migration the two halves of the product were disconnected:
-- a client's document_requests row was written and then nothing happened
-- to it ever again — no lawyer saw it (the review queue only ever showed
-- seeded rows), and the client had no way to see its outcome. That's the
-- core product loop from the root CLAUDE.md's review-model section, so it
-- can't be left as an integration someone wires up later.
--
-- Design note on why this is a trigger rather than an API insert: clients
-- must NOT get INSERT rights on review_items (they could then forge queue
-- entries, statuses, or citation checks). A SECURITY DEFINER trigger
-- creates the review item as a side effect of the client's own insert on
-- their own row, so the privilege stays server-side and RLS on
-- review_items stays lawyer-only.

-- ---------------------------------------------------------------------
-- Link review items back to what produced them.
-- ---------------------------------------------------------------------
alter table public.review_items
  add column document_request_id uuid references public.document_requests (id) on delete cascade,
  add column submitted_by uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------
-- Client-visible outcome on the request itself. The lawyer's decision is
-- mirrored here by trigger so the existing "owner read" policy on
-- document_requests is all a client needs — review_items stays
-- lawyer-only, and a client never reads another party's review record.
-- ---------------------------------------------------------------------
alter table public.document_requests
  add column review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'edited_approved', 'rejected')),
  add column delivered_text text,
  add column reviewed_at timestamptz;

-- ---------------------------------------------------------------------
-- New document request -> review queue item + its first audit event.
-- ---------------------------------------------------------------------
create function public.handle_new_document_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_item_id text := 'doc-' || replace(new.id::text, '-', '');
  requester_email text;
begin
  select email into requester_email from auth.users where id = new.user_id;

  insert into public.review_items (
    id, practice_area, entry_type, submitted_at, difficulty, status,
    question, ai_draft, citation_checks, document_request_id, submitted_by
  ) values (
    new_item_id,
    'Marriage & Family Law',
    'document_generation',
    new.generated_at,
    -- Marriage-contract conditions carry financial/custodial consequence,
    -- which the root CLAUDE.md names as high-stakes by definition.
    'high_stakes',
    'pending',
    new.situation || E'\n\nRequested conditions: ' || new.desired_conditions,
    coalesce(
      (select string_agg(c ->> 'title_en' || ': ' || (c ->> 'text_en'), E'\n\n')
       from jsonb_array_elements(new.conditions) as c),
      ''
    ),
    '[]'::jsonb,
    new.id,
    new.user_id
  );

  insert into public.audit_events (review_item_id, reviewer, action, occurred_at, note)
  values (
    new_item_id,
    coalesce(requester_email, new.user_id::text),
    'submitted',
    new.generated_at,
    'Submitted by client through the marriage-document intake form.'
  );

  return new;
end;
$$;

create trigger on_document_request_created
  after insert on public.document_requests
  for each row execute procedure public.handle_new_document_request();

-- ---------------------------------------------------------------------
-- Lawyer decision -> mirrored back onto the client's request.
-- ---------------------------------------------------------------------
create function public.sync_review_decision_to_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.document_request_id is null or new.status = old.status then
    return new;
  end if;

  update public.document_requests
  set
    review_status = new.status,
    -- Only an approval delivers text to the client; a rejection
    -- deliberately delivers nothing rather than leaking an unapproved
    -- draft the lawyer just declined.
    delivered_text = case
      when new.status in ('approved', 'edited_approved')
        then coalesce(new.edited_draft, new.ai_draft)
      else null
    end,
    reviewed_at = now()
  where id = new.document_request_id;

  return new;
end;
$$;

create trigger on_review_item_decided
  after update on public.review_items
  for each row execute procedure public.sync_review_decision_to_request();
