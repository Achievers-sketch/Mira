-- Mira: optional, withdrawable consent to use de-identified chats to improve the service.
-- Off by default. Only the user can change it; the timestamp is set by the database.

alter table public.profiles
  add column research_consent boolean not null default false,
  add column research_consent_at timestamptz;

create function public.stamp_research_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.research_consent is distinct from old.research_consent then
    new.research_consent_at := case when new.research_consent then now() else null end;
  end if;
  return new;
end;
$$;

create trigger profiles_research_consent before update on public.profiles
  for each row execute function public.stamp_research_consent();

grant update (research_consent) on public.profiles to authenticated;

-- New accounts: consent comes only from an explicit sign-up checkbox (default false).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent boolean := coalesce(new.raw_user_meta_data ->> 'research_consent', '') = 'true';
begin
  insert into public.profiles (id, display_name, research_consent, research_consent_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80),
    v_consent,
    case when v_consent then now() else null end
  );

  insert into public.user_roles (user_id, role) values (new.id, 'user');
  insert into public.subscriptions (user_id, plan_id, status) values (new.id, 'free', 'active');
  return new;
end;
$$;
