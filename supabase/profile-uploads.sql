create extension if not exists pgcrypto;

create table if not exists public.profile_uploads (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  kind text not null,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_uploads_clerk_user_id_idx
  on public.profile_uploads (clerk_user_id);

create index if not exists profile_uploads_kind_idx
  on public.profile_uploads (clerk_user_id, kind);

create or replace function public.set_profile_uploads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_uploads_set_updated_at on public.profile_uploads;

create trigger profile_uploads_set_updated_at
before update on public.profile_uploads
for each row
execute function public.set_profile_uploads_updated_at();
