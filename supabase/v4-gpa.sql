-- V4: add `gpa` to profiles so internship applications that ask for academic
-- performance pull it from the saved profile instead of asking again.
-- Nullable + defaults to empty string so existing rows are unaffected.
-- Apply once in the Supabase SQL editor against prod.

alter table public.profiles
  add column if not exists gpa text not null default '';
