create extension if not exists pgcrypto;

create table if not exists public.submitted_applications (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  source_application_id text,
  company_name text not null,
  job_title text not null,
  job_url text not null,
  location text,
  ats_type text,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submitted_applications_clerk_user_id_idx
on public.submitted_applications (clerk_user_id);

create or replace function public.set_submitted_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists submitted_applications_set_updated_at on public.submitted_applications;

create trigger submitted_applications_set_updated_at
before update on public.submitted_applications
for each row
execute function public.set_submitted_applications_updated_at();
