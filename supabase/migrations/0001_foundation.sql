-- Mira Phase 2: profiles, roles, plans, subscriptions + Row Level Security.
-- Principle: plans (entitlements) and roles (permissions) are separate. Clients can never write
-- roles, plans or subscriptions; only trusted server code (service role) can, after verification.

-- ───────── Tables ─────────
create table public.roles (
  key text primary key,
  description text not null
);

insert into public.roles (key, description) values
  ('user', 'Registered user'),
  ('peer_supporter', 'Peer supporter (provider category)'),
  ('professional', 'Professional provider (counsellor/psychologist)'),
  ('admin', 'Administrator');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null references public.roles (key),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id text primary key,
  name text not null,
  active boolean not null default false,          -- feature-flag mirror: Plus/Pro inactive at launch
  monthly_ai_message_limit integer,               -- null = no limit configured yet
  monthly_human_sessions integer not null default 0,
  price_kobo integer check (price_kobo is null or price_kobo >= 0), -- null = not decided
  sort_order integer not null default 0
);

insert into public.plans (id, name, active, monthly_ai_message_limit, monthly_human_sessions, price_kobo, sort_order) values
  ('free', 'Mira Free', true,  100, 0, 0,    1),
  ('plus', 'Mira Plus', false, null, 0, null, 2),
  ('pro',  'Mira Pro',  false, null, 0, null, 3);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_active_per_user
  on public.subscriptions (user_id) where status = 'active';

-- ───────── Helpers ─────────
create function public.has_role(p_user uuid, p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = p_user and role = p_role);
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(auth.uid(), 'admin');
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- New auth user => profile + 'user' role + free subscription. Roles are never taken from user input.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80));

  insert into public.user_roles (user_id, role) values (new.id, 'user');
  insert into public.subscriptions (user_id, plan_id, status) values (new.id, 'free', 'active');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── Privileges (deny by default) ─────────
revoke all on public.roles, public.user_roles, public.profiles, public.plans, public.subscriptions
  from anon, authenticated;
revoke execute on function public.has_role(uuid, text), public.is_admin(), public.handle_new_user()
  from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

grant select on public.plans to anon, authenticated;
grant select on public.roles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ───────── Row Level Security ─────────
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

create policy plans_read on public.plans for select to anon, authenticated using (true);
create policy roles_read on public.roles for select to authenticated using (true);

create policy user_roles_read_own on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy profiles_read_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy subscriptions_read_own on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- No insert/update/delete policies exist for roles, user_roles, plans or subscriptions:
-- authenticated clients cannot change them. Only the service role (server-only) can.
