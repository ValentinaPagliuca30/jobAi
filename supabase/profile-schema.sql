create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null unique,
  basic_info jsonb not null default '{}'::jsonb,
  identity_info jsonb not null default '{}'::jsonb,
  application_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();
