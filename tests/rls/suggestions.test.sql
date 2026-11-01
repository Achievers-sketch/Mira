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
