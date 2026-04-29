create extension if not exists pgcrypto;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default gen_random_uuid(),
  clerk_user_id text not null,
  company_name text,
  job_title text,
  job_url text not null,
  ats_type text,
  job_description text,
  location text,
  status text not null default 'intake_complete',
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_applications_clerk_user_id_idx
on public.job_applications (clerk_user_id);

create or replace function public.set_job_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists job_applications_set_updated_at on public.job_applications;

create trigger job_applications_set_updated_at
before update on public.job_applications
for each row
execute function public.set_job_applications_updated_at();
