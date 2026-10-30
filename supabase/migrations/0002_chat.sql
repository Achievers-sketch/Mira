-- Mira Phase 3: AI chat storage, usage limits and verified crisis contacts.
-- Chat tables are written ONLY by trusted server code (service role). Signed-in users can read and
-- delete their own conversations; nobody else (including admins) can read chat content.

-- ───────── Tables ─────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_updated on public.conversations (user_id, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  safety_flag text check (safety_flag is null or safety_flag = 'crisis'),
  created_at timestamptz not null default now()
);
create index messages_conversation_created on public.messages (conversation_id, created_at);

-- Usage is separate from messages so that deleting a conversation never resets a user's limit.
create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'ai_message',
  created_at timestamptz not null default now()
);
create index usage_events_user_created on public.usage_events (user_id, kind, created_at desc);

-- Crisis contacts are shown to users only after an administrator has verified them.
create table public.crisis_contacts (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 120),
  phone text not null check (char_length(phone) between 3 and 40),
  country text not null default 'NG',
  notes text check (notes is null or char_length(notes) <= 300),
  active boolean not null default false,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ───────── Atomic usage check (service role only) ─────────
-- Returns 'ok' (and records the event), 'rate_limited' or 'limit_reached'.
create function public.consume_ai_message(
  p_user uuid,
  p_monthly_limit integer,
  p_per_minute integer
)
returns table (status text, event_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month_start timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  v_id uuid;
begin
  -- Serialise concurrent requests from the same user so limits cannot be raced.
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  if (select count(*) from public.usage_events
        where user_id = p_user and kind = 'ai_message' and created_at > now() - interval '1 minute')
     >= p_per_minute then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  if p_monthly_limit is not null and
     (select count(*) from public.usage_events
        where user_id = p_user and kind = 'ai_message' and created_at >= v_month_start)
     >= p_monthly_limit then
    return query select 'limit_reached'::text, null::uuid;
    return;
  end if;

  insert into public.usage_events (user_id, kind) values (p_user, 'ai_message') returning id into v_id;
  return query select 'ok'::text, v_id;
end;
$$;

-- ───────── Privileges (deny by default) ─────────
revoke all on public.conversations, public.messages, public.usage_events, public.crisis_contacts
  from anon, authenticated;
revoke execute on function public.consume_ai_message(uuid, integer, integer)
  from public, anon, authenticated;

grant select, delete on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant select on public.usage_events to authenticated;
grant select on public.crisis_contacts to anon, authenticated;

-- Explicit for the server-side service role (already the default on Supabase; needed elsewhere).
grant all on public.conversations, public.messages, public.usage_events, public.crisis_contacts to service_role;
grant execute on function public.consume_ai_message(uuid, integer, integer) to service_role;

-- ───────── Row Level Security ─────────
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.usage_events enable row level security;
alter table public.crisis_contacts enable row level security;

create policy conversations_read_own on public.conversations for select to authenticated
  using (user_id = auth.uid());
create policy conversations_delete_own on public.conversations for delete to authenticated
  using (user_id = auth.uid());

create policy messages_read_own on public.messages for select to authenticated
  using (user_id = auth.uid());

create policy usage_read_own on public.usage_events for select to authenticated
  using (user_id = auth.uid());

create policy crisis_contacts_read_verified on public.crisis_contacts for select to anon, authenticated
  using (active and verified_at is not null);

-- No insert/update policies exist on chat tables: only the service role writes them.
-- No admin policy exists on conversations/messages: admins cannot read chat content.
