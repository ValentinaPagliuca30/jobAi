create table if not exists public.application_questions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  clerk_user_id text not null,
  source_question_id text,
  position integer not null default 0,
  question_text text not null,
  question_type text,
  required boolean default false,
  options jsonb,
  ats_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists application_questions_unique
  on public.application_questions (application_id, source_question_id)
  where source_question_id is not null;

create index if not exists application_questions_app_idx
  on public.application_questions (application_id);

create index if not exists application_questions_clerk_user_idx
  on public.application_questions (clerk_user_id);

create or replace function public.set_application_questions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists application_questions_set_updated_at on public.application_questions;

create trigger application_questions_set_updated_at
before update on public.application_questions
for each row
execute function public.set_application_questions_updated_at();
