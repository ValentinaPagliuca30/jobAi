-- V4: track outcome of each submitted application (applied → interviewing →
-- offer / rejected / withdrawn). Defaults to 'applied' so existing rows
-- behave unchanged. Apply once in the Supabase SQL editor against prod.

alter table public.submitted_applications
  add column if not exists response_status text not null default 'applied',
  add column if not exists responded_at timestamptz;
