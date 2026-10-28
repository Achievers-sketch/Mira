-- RLS tests. Run by tests/rls/run.sh. Any failed check raises an exception and aborts.
\set ON_ERROR_STOP on
\set QUIET on

create function pg_temp.expect(label text, cond boolean) returns void language plpgsql as $$
begin
  if cond then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if;
end $$;

-- fixtures (as superuser)
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@example.test', '{"display_name":"Alice"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@example.test', '{"display_name":"Bob","role":"admin","plan":"pro"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'admin@example.test', '{}');
insert into public.user_roles (user_id, role) values ('cccccccc-0000-0000-0000-000000000003', 'admin');

-- trigger behaviour
select pg_temp.expect('signup creates profile', (select count(*) from public.profiles) = 3);
select pg_temp.expect('signup gives only the user role (metadata role ignored)',
  (select count(*) from public.user_roles where user_id = 'bbbbbbbb-0000-0000-0000-000000000002' and role = 'user') = 1
  and (select count(*) from public.user_roles where user_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 1);
select pg_temp.expect('signup gives free plan only (metadata plan ignored)',
  (select plan_id from public.subscriptions where user_id = 'bbbbbbbb-0000-0000-0000-000000000002') = 'free');

-- ── Alice (authenticated) ──
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);

select pg_temp.expect('alice sees only her profile', (select count(*) from public.profiles) = 1);
select pg_temp.expect('alice sees only her roles', (select count(*) from public.user_roles) = 1);
select pg_temp.expect('alice sees only her subscription', (select count(*) from public.subscriptions) = 1);
select pg_temp.expect('alice can read plans', (select count(*) from public.plans) = 3);
select pg_temp.expect('plus and pro are inactive', (select count(*) from public.plans where active) = 1);
select pg_temp.expect('alice is not admin', not public.is_admin());

update public.profiles set display_name = 'Alice R' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select pg_temp.expect('alice can edit own display name',
  (select display_name from public.profiles) = 'Alice R');

update public.profiles set display_name = 'Hacked' where id = 'bbbbbbbb-0000-0000-0000-000000000002';
select pg_temp.expect('alice cannot edit bob (0 rows visible)', (select count(*) from public.profiles) = 1);

do $$ begin
  begin
    insert into public.user_roles (user_id, role) values ('aaaaaaaa-0000-0000-0000-000000000001', 'admin');
    raise exception 'FAIL  alice granted herself admin';
  exception when insufficient_privilege then raise notice 'PASS  alice cannot insert roles'; end;
end $$;

do $$ begin
  begin
    update public.subscriptions set plan_id = 'pro';
    raise exception 'FAIL  alice upgraded her own plan';
  exception when insufficient_privilege then raise notice 'PASS  alice cannot update subscriptions'; end;
end $$;

do $$ begin
  begin
    insert into public.subscriptions (user_id, plan_id) values ('aaaaaaaa-0000-0000-0000-000000000001', 'pro');
    raise exception 'FAIL  alice created a pro subscription';
  exception when insufficient_privilege then raise notice 'PASS  alice cannot insert subscriptions'; end;
end $$;

do $$ begin
  begin
    update public.plans set active = true;
    raise exception 'FAIL  alice activated a plan';
  exception when insufficient_privilege then raise notice 'PASS  alice cannot edit plans'; end;
end $$;

do $$ begin
  begin
    update public.profiles set id = 'bbbbbbbb-0000-0000-0000-000000000002';
    raise exception 'FAIL  alice changed profile id';
  exception when insufficient_privilege then raise notice 'PASS  alice cannot change profile id'; end;
end $$;

do $$ begin
  begin
    delete from public.user_roles;
    raise exception 'FAIL  alice deleted roles';
  exception when insufficient_privilege then raise notice 'PASS  alice cannot delete roles'; end;
end $$;

-- ── anonymous ──
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect('anon can read plans', (select count(*) from public.plans) = 3);
do $$ begin
  begin
    perform count(*) from public.profiles;
    raise exception 'FAIL  anon read profiles';
  exception when insufficient_privilege then raise notice 'PASS  anon cannot read profiles'; end;
end $$;

-- ── admin ──
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000003', false);
select pg_temp.expect('admin recognised', public.is_admin());
select pg_temp.expect('admin can see all profiles', (select count(*) from public.profiles) = 3);
select pg_temp.expect('admin can see all subscriptions', (select count(*) from public.subscriptions) = 3);
do $$ begin
  begin
    insert into public.user_roles (user_id, role) values ('aaaaaaaa-0000-0000-0000-000000000001', 'admin');
    raise exception 'FAIL  admin wrote roles from client';
  exception when insufficient_privilege then raise notice 'PASS  even admin cannot write roles from the client (server only)'; end;
end $$;

reset role;
\echo ALL RLS TESTS PASSED
