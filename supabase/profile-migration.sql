alter table public.profiles
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
add column if not exists disability_status text;

create unique index if not exists profiles_clerk_user_id_idx
on public.profiles (clerk_user_id);

create table if not exists public.profile_answers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  answer_key text not null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, answer_key)
);

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
