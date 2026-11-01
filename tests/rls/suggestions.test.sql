\set ON_ERROR_STOP on
\set QUIET on

create function pg_temp.expect(label text, cond boolean) returns void language plpgsql as $$
begin
  if cond then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if;
end $$;

insert into auth.users (id, email) values
  ('aaaaaaaa-2222-0000-0000-000000000001', 'erin@example.test'),
  ('bbbbbbbb-2222-0000-0000-000000000002', 'finn@example.test'),
  ('cccccccc-2222-0000-0000-000000000003', 'admin2@example.test');
insert into public.user_roles (user_id, role) values ('cccccccc-2222-0000-0000-000000000003', 'admin');

set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-2222-0000-0000-000000000001', false);
insert into public.suggestions (user_id, category, message, follow_up_ok)
  values ('aaaaaaaa-2222-0000-0000-000000000001', 'tone', 'Please be a little warmer.', true);
select pg_temp.expect('erin can add her own suggestion', (select count(*) from public.suggestions) = 1);

do $$ begin begin
  insert into public.suggestions (user_id, category, message)
  values ('bbbbbbbb-2222-0000-0000-000000000002', 'tone', 'Posting as finn is not allowed');
  raise exception 'FAIL  erin posted as finn';
exception when insufficient_privilege or check_violation then raise notice 'PASS  erin cannot post as another user'; end; end $$;

do $$ begin begin
  insert into public.suggestions (user_id, category, message)
  values ('aaaaaaaa-2222-0000-0000-000000000001', 'tone', 'short');
  raise exception 'FAIL  too-short message accepted';
exception when check_violation then raise notice 'PASS  too-short message rejected'; end; end $$;

do $$ begin begin
  insert into public.suggestions (user_id, category, message)
  values ('aaaaaaaa-2222-0000-0000-000000000001', 'bogus', 'A long enough message here');
  raise exception 'FAIL  bad category accepted';
exception when check_violation then raise notice 'PASS  unknown category rejected'; end; end $$;

do $$ begin begin
  update public.suggestions set message = 'edited after the fact';
  raise exception 'FAIL  erin edited a suggestion';
exception when insufficient_privilege then raise notice 'PASS  suggestions cannot be edited'; end; end $$;

-- limit: erin has 1, add 4 more OK, 6th blocked
insert into public.suggestions (user_id, category, message)
select 'aaaaaaaa-2222-0000-0000-000000000001', 'other', 'Another idea number ' || g from generate_series(1, 4) g;
do $$ begin begin
  insert into public.suggestions (user_id, category, message)
  values ('aaaaaaaa-2222-0000-0000-000000000001', 'other', 'This sixth one is too many');
  raise exception 'FAIL  sixth suggestion in 24h accepted';
exception when sqlstate 'P0001' then raise notice 'PASS  limit of 5 per 24h enforced'; end; end $$;

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-2222-0000-0000-000000000002', false);
select pg_temp.expect('finn sees none of erin''s suggestions', (select count(*) from public.suggestions) = 0);

reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-2222-0000-0000-000000000003', false);
select pg_temp.expect('admin can read all suggestions', (select count(*) from public.suggestions) = 5);

reset role;
set role anon;
do $$ begin begin
  perform count(*) from public.suggestions;
  raise exception 'FAIL  anon read suggestions';
exception when insufficient_privilege then raise notice 'PASS  anon has no access'; end; end $$;
reset role;

-- ── research consent ──
insert into auth.users (id, email, raw_user_meta_data) values
  ('dddddddd-2222-0000-0000-000000000004', 'gia@example.test', '{"research_consent":"true","display_name":"Gia"}'),
  ('eeeeeeee-2222-0000-0000-000000000005', 'hal@example.test', '{"display_name":"Hal"}');
select pg_temp.expect('sign-up checkbox sets consent and timestamp',
  (select research_consent and research_consent_at is not null from public.profiles where id = 'dddddddd-2222-0000-0000-000000000004'));
select pg_temp.expect('consent is off by default',
  (select not research_consent and research_consent_at is null from public.profiles where id = 'eeeeeeee-2222-0000-0000-000000000005'));

set role authenticated;
select set_config('request.jwt.claim.sub', 'eeeeeeee-2222-0000-0000-000000000005', false);
update public.profiles set research_consent = true where id = 'eeeeeeee-2222-0000-0000-000000000005';
select pg_temp.expect('user can opt in; database stamps the time',
  (select research_consent and research_consent_at is not null from public.profiles where id = 'eeeeeeee-2222-0000-0000-000000000005'));
update public.profiles set research_consent = false where id = 'eeeeeeee-2222-0000-0000-000000000005';
select pg_temp.expect('withdrawal clears consent and timestamp',
  (select not research_consent and research_consent_at is null from public.profiles where id = 'eeeeeeee-2222-0000-0000-000000000005'));
do $$ begin begin
  update public.profiles set research_consent_at = now() where id = 'eeeeeeee-2222-0000-0000-000000000005';
  raise exception 'FAIL  user set consent timestamp directly';
exception when insufficient_privilege then raise notice 'PASS  user cannot write the consent timestamp'; end; end $$;
update public.profiles set research_consent = true where id = 'dddddddd-2222-0000-0000-000000000004';
select pg_temp.expect('user cannot change another user''s consent',
  (select research_consent from public.profiles where id = 'dddddddd-2222-0000-0000-000000000004') is null);
reset role;
