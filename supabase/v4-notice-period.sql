-- V4: add `notice_period` to profiles so applicants can save how soon they
-- can start a new role (e.g. "Available immediately", "2 weeks", "1 month").
-- The column is nullable + defaults to empty string so existing rows are
-- unaffected. Apply this once in the Supabase SQL editor against prod.

alter table public.profiles
  add column if not exists notice_period text not null default '';
