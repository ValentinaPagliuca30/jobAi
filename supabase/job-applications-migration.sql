alter table public.job_applications
add column if not exists user_id uuid default gen_random_uuid(),
add column if not exists clerk_user_id text,
add column if not exists company_name text,
add column if not exists job_title text,
add column if not exists job_url text,
add column if not exists ats_type text,
add column if not exists job_description text,
add column if not exists location text,
add column if not exists status text default 'intake_complete',
add column if not exists applied_at timestamptz,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

update public.job_applications
set clerk_user_id = user_id::text
where clerk_user_id is null
  and user_id is not null;

alter table public.job_applications
alter column user_id drop not null;

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
