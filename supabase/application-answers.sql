alter table public.job_applications
  add column if not exists selected_resume_id uuid;

create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  clerk_user_id text not null,
  question_key text not null,
  question_text text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, question_key)
);

create index if not exists application_answers_application_id_idx
  on public.application_answers (application_id);

create index if not exists application_answers_clerk_user_id_idx
  on public.application_answers (clerk_user_id);

create or replace function public.set_application_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists application_answers_set_updated_at on public.application_answers;

create trigger application_answers_set_updated_at
before update on public.application_answers
for each row
execute function public.set_application_answers_updated_at();
