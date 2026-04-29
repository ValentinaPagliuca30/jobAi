create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default gen_random_uuid(),
  clerk_user_id text,
  email text,
  full_name text,
  preferred_name text,
  phone text,
  location text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  school text,
  degree text,
  program text,
  graduation_date text,
  work_authorization text,
  sponsorship_answer text,
  gender text,
  race_ethnicity text,
  veteran_status text,
  disability_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists user_id uuid default gen_random_uuid(),
add column if not exists clerk_user_id text,
add column if not exists email text,
add column if not exists full_name text,
add column if not exists preferred_name text,
add column if not exists phone text,
add column if not exists location text,
add column if not exists linkedin_url text,
add column if not exists github_url text,
add column if not exists portfolio_url text,
add column if not exists school text,
add column if not exists degree text,
add column if not exists program text,
add column if not exists graduation_date text,
add column if not exists work_authorization text,
add column if not exists sponsorship_answer text,
add column if not exists gender text,
add column if not exists race_ethnicity text,
add column if not exists veteran_status text,
add column if not exists disability_status text,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

update public.profiles
set clerk_user_id = user_id::text
where clerk_user_id is null
  and user_id is not null;

alter table public.profiles
alter column user_id drop not null;

create unique index if not exists profiles_clerk_user_id_idx
on public.profiles (clerk_user_id);

create table if not exists public.profile_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default gen_random_uuid(),
  clerk_user_id text,
  answer_key text not null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_answers
add column if not exists user_id uuid default gen_random_uuid(),
add column if not exists clerk_user_id text,
add column if not exists answer_key text,
add column if not exists title text,
add column if not exists content text,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

update public.profile_answers
set clerk_user_id = user_id::text
where clerk_user_id is null
  and user_id is not null;

alter table public.profile_answers
alter column user_id drop not null;

create unique index if not exists profile_answers_clerk_user_id_answer_key_idx
on public.profile_answers (clerk_user_id, answer_key);

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

create or replace function public.set_profile_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_answers_set_updated_at on public.profile_answers;

create trigger profile_answers_set_updated_at
before update on public.profile_answers
for each row
execute function public.set_profile_answers_updated_at();
