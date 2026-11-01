-- Mira: user suggestions for improving the chat. Signed-in users write and read only their own;
-- administrators can read all (to act on them). Limited to 5 per rolling 24 hours per user.

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('tone', 'safety', 'features', 'voice', 'privacy', 'other')),
  message text not null check (char_length(message) between 10 and 1000),
  follow_up_ok boolean not null default false,
  created_at timestamptz not null default now()
);
create index suggestions_user_created on public.suggestions (user_id, created_at desc);
create index suggestions_created on public.suggestions (created_at desc);

create function public.limit_suggestions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.suggestions
        where user_id = new.user_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'suggestion_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.limit_suggestions() from public, anon, authenticated;

create trigger suggestions_limit before insert on public.suggestions
  for each row execute function public.limit_suggestions();

revoke all on public.suggestions from anon, authenticated;
grant select, insert, delete on public.suggestions to authenticated;
grant all on public.suggestions to service_role;

alter table public.suggestions enable row level security;
create policy suggestions_insert_own on public.suggestions for insert to authenticated
  with check (user_id = auth.uid());
create policy suggestions_read_own on public.suggestions for select to authenticated
  using (user_id = auth.uid());
create policy suggestions_read_admin on public.suggestions for select to authenticated
  using (public.is_admin());
create policy suggestions_delete_own on public.suggestions for delete to authenticated
  using (user_id = auth.uid());
