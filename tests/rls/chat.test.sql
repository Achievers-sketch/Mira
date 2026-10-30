\set ON_ERROR_STOP on
\set QUIET on

create function pg_temp.expect(label text, cond boolean) returns void language plpgsql as $$
begin
  if cond then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if;
end $$;

insert into auth.users (id, email) values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'carol@example.test'),
  ('bbbbbbbb-1111-0000-0000-000000000002', 'dave@example.test'),
  ('cccccccc-1111-0000-0000-000000000003', 'root@example.test');
insert into public.user_roles (user_id, role) values ('cccccccc-1111-0000-0000-000000000003', 'admin');

-- ── server (service role) writes chat data ──
set role service_role;
insert into public.conversations (id, user_id, title) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-0000-0000-000000000001', 'Carol chat'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-1111-0000-0000-000000000002', 'Dave chat');
insert into public.messages (conversation_id, user_id, role, content) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-0000-0000-000000000001', 'user', 'hello from carol'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-0000-0000-000000000001', 'assistant', 'hi carol'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-1111-0000-0000-000000000002', 'user', 'private from dave');
insert into public.crisis_contacts (label, phone, active, verified_at) values
  ('Verified line', '000', true, now()),
  ('Unverified line', '111', true, null),
  ('Inactive line', '222', false, now());
select pg_temp.expect('service role can write chat data', (select count(*) from public.messages) = 3);

-- ── usage function ──
select pg_temp.expect('first call ok',
  (select status from public.consume_ai_message('aaaaaaaa-1111-0000-0000-000000000001', 3, 100)) = 'ok');
select pg_temp.expect('second call ok',
  (select status from public.consume_ai_message('aaaaaaaa-1111-0000-0000-000000000001', 3, 100)) = 'ok');
select pg_temp.expect('third call ok',
  (select status from public.consume_ai_message('aaaaaaaa-1111-0000-0000-000000000001', 3, 100)) = 'ok');
select pg_temp.expect('fourth call blocked by monthly limit',
  (select status from public.consume_ai_message('aaaaaaaa-1111-0000-0000-000000000001', 3, 100)) = 'limit_reached');
select pg_temp.expect('blocked call records no usage',
  (select count(*) from public.usage_events where user_id = 'aaaaaaaa-1111-0000-0000-000000000001') = 3);
select pg_temp.expect('per-minute limit applies',
  (select status from public.consume_ai_message('bbbbbbbb-1111-0000-0000-000000000002', null, 1)) = 'ok'
  and (select status from public.consume_ai_message('bbbbbbbb-1111-0000-0000-000000000002', null, 1)) = 'rate_limited');
select pg_temp.expect('null monthly limit means unlimited per month',
  (select status from public.consume_ai_message('cccccccc-1111-0000-0000-000000000003', null, 100)) = 'ok');

-- ── Carol ──
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-1111-0000-0000-000000000001', false);
select pg_temp.expect('carol reads only her conversations', (select count(*) from public.conversations) = 1);
select pg_temp.expect('carol reads only her messages', (select count(*) from public.messages) = 2);
select pg_temp.expect('carol reads her usage', (select count(*) from public.usage_events) = 3);

do $$ begin begin
  insert into public.messages (conversation_id, user_id, role, content)
  values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-0000-0000-000000000001', 'assistant', 'forged reply');
  raise exception 'FAIL  carol forged an assistant message';
exception when insufficient_privilege then raise notice 'PASS  carol cannot insert messages (no forged assistant turns)'; end; end $$;

do $$ begin begin
  insert into public.conversations (user_id, title) values ('aaaaaaaa-1111-0000-0000-000000000001', 'x');
  raise exception 'FAIL  carol created a conversation directly';
exception when insufficient_privilege then raise notice 'PASS  carol cannot insert conversations'; end; end $$;

do $$ begin begin
  insert into public.usage_events (user_id) values ('aaaaaaaa-1111-0000-0000-000000000001');
  raise exception 'FAIL  carol wrote usage';
exception when insufficient_privilege then raise notice 'PASS  carol cannot write usage'; end; end $$;

do $$ begin begin
  delete from public.usage_events;
  raise exception 'FAIL  carol deleted usage';
exception when insufficient_privilege then raise notice 'PASS  carol cannot delete usage (limit cannot be reset)'; end; end $$;

do $$ begin begin
  update public.messages set content = 'edited';
  raise exception 'FAIL  carol edited messages';
exception when insufficient_privilege then raise notice 'PASS  carol cannot edit messages'; end; end $$;

do $$ begin begin
  perform * from public.consume_ai_message('aaaaaaaa-1111-0000-0000-000000000001', 1000, 1000);
  raise exception 'FAIL  carol called the usage function';
exception when insufficient_privilege then raise notice 'PASS  carol cannot call the usage function'; end; end $$;

delete from public.conversations where id = '22222222-2222-2222-2222-222222222222';
reset role;
select pg_temp.expect('carol cannot delete dave''s conversation',
  (select count(*) from public.conversations where id = '22222222-2222-2222-2222-222222222222') = 1);

set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-1111-0000-0000-000000000001', false);
delete from public.conversations where id = '11111111-1111-1111-1111-111111111111';
reset role;
select pg_temp.expect('carol can delete her own conversation, messages cascade',
  (select count(*) from public.messages where conversation_id = '11111111-1111-1111-1111-111111111111') = 0);
select pg_temp.expect('deleting a conversation does not reset usage',
  (select count(*) from public.usage_events where user_id = 'aaaaaaaa-1111-0000-0000-000000000001') = 3);

-- ── admin cannot read chat content ──
set role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-1111-0000-0000-000000000003', false);
select pg_temp.expect('admin cannot read others'' conversations', (select count(*) from public.conversations) = 0);
select pg_temp.expect('admin cannot read others'' messages', (select count(*) from public.messages) = 0);

-- ── crisis contacts ──
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect('anon sees only verified+active crisis contacts',
  (select count(*) from public.crisis_contacts) = 1
  and (select label from public.crisis_contacts) = 'Verified line');
do $$ begin begin
  perform count(*) from public.messages;
  raise exception 'FAIL  anon read messages';
exception when insufficient_privilege then raise notice 'PASS  anon cannot read messages'; end; end $$;
do $$ begin begin
  insert into public.crisis_contacts (label, phone, active, verified_at) values ('fake', '999', true, now());
  raise exception 'FAIL  anon inserted a crisis contact';
exception when insufficient_privilege then raise notice 'PASS  anon cannot insert crisis contacts'; end; end $$;

reset role;
\echo ALL CHAT RLS TESTS PASSED
