-- V2 migration: text extraction columns on profile_uploads.
-- Apply after profile-uploads.sql has been run.

alter table public.profile_uploads
  add column if not exists extracted_text text;

alter table public.profile_uploads
  add column if not exists extraction_status text default 'pending';

alter table public.profile_uploads
  add column if not exists extracted_at timestamptz;

create index if not exists profile_uploads_extraction_status_idx
  on public.profile_uploads (clerk_user_id, extraction_status);
