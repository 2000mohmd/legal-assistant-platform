-- Local-dev seed data only. Every identifier here is fabricated demo
-- content (practice-area placeholders, TEST-* citations) — see the root
-- CLAUDE.md anti-fabrication rule. Never run this against a production
-- project with real users.

insert into public.practice_areas
  (slug, name_ar, name_en, description_ar, description_en, status, href, sort_order)
values
  ('marriage-family', 'الأحوال الشخصية والزواج', 'Marriage & Family Law',
   'استشارات وإعداد مستندات لعقود الزواج والأحوال الشخصية.',
   'Guidance and document assistance for marriage contracts and family matters.',
   'live', '/marriage/chat', 1),
  -- Descriptions say what each service IS. Availability is already stated
  -- by the tile's badge and its "not yet live" note, so repeating
  -- "coming soon" here said the same thing three times on one card.
  ('commercial-corporate', 'الشركات والأعمال التجارية', 'Commercial & Corporate',
   'تأسيس الشركات، العقود التجارية، ومسائل الشركاء.',
   'Company formation, commercial contracts, and shareholder matters.',
   'coming_soon', null, 2),
  ('real-estate', 'العقارات', 'Real Estate',
   'عقود البيع والإيجار، الملكية، ونزاعات العقار.',
   'Sale and lease agreements, ownership, and property disputes.',
   'coming_soon', null, 3),
  ('labor-employment', 'العمل والعمال', 'Labor & Employment',
   'عقود العمل، إنهاء الخدمة، وحقوق نهاية الخدمة.',
   'Employment contracts, termination, and end-of-service entitlements.',
   'coming_soon', null, 4),
  ('inheritance', 'المواريث', 'Inheritance',
   'حصر الإرث، قسمة التركة، والوصايا.',
   'Estate inventory, division of an estate, and wills.',
   'coming_soon', null, 5);

insert into public.review_items
  (id, practice_area, entry_type, submitted_at, difficulty, status, question, ai_draft, citation_checks)
values
  ('rev-001', 'Marriage & Family Law', 'qa', now() - interval '2 hours', 'routine', 'pending',
   'هل يجوز الاتفاق على تأجيل جزء من المهر؟ / Can part of the dowry be deferred?',
   'نعم، يجوز الاتفاق على تقسيم المهر إلى معجل ومؤجل، ويُدرج هذا الاتفاق كتابةً ضمن عقد الزواج قبل توثيقه عبر منصة ناجز. يُنصح بتحديد أجل واضح للجزء المؤجل.',
   '[{"citation":{"source_document":"Family Relations Statute (Demo Corpus)","article_or_madda":"Art. 9 (sample)","quoted_text":"[Illustrative sample — not real statutory language] the dowry may be split between an immediate and a deferred portion by written agreement.","is_illustrative":true},"result":"passed","note":"Matches retrieved source text exactly; article exists in corpus."}]'::jsonb),
  ('rev-002', 'Marriage & Family Law', 'qa', now() - interval '1 hour', 'high_stakes', 'pending',
   'من له الحق في حضانة الأطفال بعد الطلاق؟ / Who has custody rights after divorce?',
   'تُمنح الحضانة عادة وفق تقدير المحكمة بما يحقق مصلحة الطفل الفضلى، مع مراعاة أي شروط اتُفق عليها ضمن عقد الزواج. يمكن أن تشمل الشروط ترتيبات الزيارة بعد انتهاء فترة الحضانة الأساسية.',
   '[{"citation":{"source_document":"Family Relations Statute (Demo Corpus)","article_or_madda":"Art. 22 (sample)","quoted_text":"[Illustrative sample — not real statutory language] custody arrangements agreed within the contract are subject to review by the competent court.","is_illustrative":true},"result":"passed","note":"Article exists and matches the general framing."},{"citation":{"source_document":"Family Relations Statute (Demo Corpus)","article_or_madda":"Art. 23 (sample)","quoted_text":"[Illustrative sample — not real statutory language] post-custody visitation terms follow a separate schedule set by the court.","is_illustrative":true},"result":"flagged","note":"Retrieved excerpt does not clearly support the visitation claim in the draft — needs lawyer confirmation."}]'::jsonb),
  ('rev-003', 'Marriage & Family Law', 'document_generation', now() - interval '20 minutes', 'high_stakes', 'pending',
   'إعداد شروط عقد زواج مخصصة تتضمن شرط استمرار عمل الزوجة / Draft custom marriage-contract conditions including a wife''s-right-to-work clause',
   'الشرط المقترح: يحق للزوجة الاستمرار في عملها الحالي بعد الزواج، ولا يجوز للزوج مطالبتها بتركه إلا باتفاق مكتوب لاحق بين الطرفين.',
   '[{"citation":{"source_document":"Family Relations Statute (Demo Corpus)","article_or_madda":"Art. 14 (sample)","quoted_text":"[Illustrative sample — not real statutory language] any lawful condition agreed by both parties and recorded in the contract is binding.","is_illustrative":true},"result":"passed","note":"Supports enforceability of custom conditions generally."}]'::jsonb);

insert into public.audit_events (review_item_id, reviewer, action, occurred_at)
values
  ('rev-001', 'system', 'submitted', now() - interval '2 hours'),
  ('rev-002', 'system', 'submitted', now() - interval '1 hour'),
  ('rev-003', 'system', 'submitted', now() - interval '20 minutes');

-- Local-dev-only test lawyer account (magic-link auth has no password to
-- seed) — lets you sign in as a lawyer at lawyer@test.local without going
-- through the email flow. NEVER do this against a real/production project.
--
-- The token_* / encrypted_password columns MUST be empty strings, not
-- NULL (the schema allows NULL, but GoTrue's Go code doesn't handle it) —
-- hit this live: omitting them produced "Database error finding user" on
-- every signInWithOtp() call for this account, which read as a broken
-- magic-link flow until traced back to this specific row.
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  encrypted_password
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'lawyer@test.local', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', '', '', '', '', '', ''
);

update public.profiles set role = 'lawyer', full_name = 'Test Reviewing Lawyer'
where email = 'lawyer@test.local';

-- LOCAL DEV / TEST ONLY. Auto-promotes any signup at @lawyer.test.local to
-- the lawyer role, so an automated test can mint its own throwaway lawyer
-- instead of every lawyer test sharing the one fixed account above.
--
-- That sharing was a real, already-observed source of flakiness, not a
-- hypothetical: several specs signing into the same address moments apart
-- each poll the same Mailpit inbox, and one can consume the other's
-- single-use magic link — whichever test loses silently lands back on
-- /login. `.serial` fixed it inside one file; it cannot fix it across
-- files running in parallel workers. Unique addresses fix it everywhere.
--
-- This lives in seed.sql, never in a migration, precisely because it must
-- not exist anywhere real: it makes role assignment depend on an email
-- domain, which is self-service privilege escalation for anyone who can
-- receive mail at that domain. Promotion in production stays a manual,
-- deliberate act (see handle_new_user in 0001_init.sql).
create function public.dev_only_promote_test_lawyers()
returns trigger
language plpgsql
as $$
begin
  if new.email like '%@lawyer.test.local' then
    new.role := 'lawyer';
  end if;
  return new;
end;
$$;

-- BEFORE INSERT on profiles, not on auth.users: handle_new_user() is what
-- creates the profile row, so hooking auth.users would depend on trigger
-- firing order between two triggers on the same table. This one runs on
-- the row being written, which is unambiguous.
create trigger dev_only_promote_test_lawyers
  before insert on public.profiles
  for each row execute procedure public.dev_only_promote_test_lawyers();
