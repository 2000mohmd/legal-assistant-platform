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
  ('commercial-corporate', 'الشركات والأعمال التجارية', 'Commercial & Corporate',
   'قريباً — قيد التحقق من دقة الإجابات مع المحامين.',
   'Coming soon — accuracy review with our lawyers is still underway.',
   'coming_soon', null, 2),
  ('real-estate', 'العقارات', 'Real Estate',
   'قريباً — قيد التحقق من دقة الإجابات مع المحامين.',
   'Coming soon — accuracy review with our lawyers is still underway.',
   'coming_soon', null, 3),
  ('labor-employment', 'العمل والعمال', 'Labor & Employment',
   'قريباً — قيد التحقق من دقة الإجابات مع المحامين.',
   'Coming soon — accuracy review with our lawyers is still underway.',
   'coming_soon', null, 4),
  ('inheritance', 'المواريث', 'Inheritance',
   'قريباً — قيد التحقق من دقة الإجابات مع المحامين.',
   'Coming soon — accuracy review with our lawyers is still underway.',
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
