create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default gen_random_uuid(),
  clerk_user_id text not null unique,
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

create table if not exists public.profile_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default gen_random_uuid(),
  clerk_user_id text not null,
  answer_key text not null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, answer_key)
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
