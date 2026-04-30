-- Remove the legacy foreign keys from user_id -> auth.users.
-- Ownership is now tracked via clerk_user_id; user_id stays only as a
-- nullable column with a default, so existing rows keep working but new
-- inserts no longer require a matching auth.users row.

alter table public.profiles
  drop constraint if exists profiles_user_id_fkey;

alter table public.profile_answers
  drop constraint if exists profile_answers_user_id_fkey;

alter table public.job_applications
  drop constraint if exists job_applications_user_id_fkey;

-- Make sure the column allows null in case earlier migrations did not run.
alter table public.profiles         alter column user_id drop not null;
alter table public.profile_answers  alter column user_id drop not null;
alter table public.job_applications alter column user_id drop not null;
