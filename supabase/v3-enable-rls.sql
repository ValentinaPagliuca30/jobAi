-- V3 security: enable Row-Level Security on all JobPilot tables.
--
-- The application accesses Supabase exclusively via the service_role key from
-- server routes after Clerk auth (see web/lib/supabase-admin.ts). service_role
-- always bypasses RLS by design, so this migration does NOT change current
-- application behavior.
--
-- What it DOES change: if anyone ever accesses these tables through any
-- other path (anonymous key, leaked anon endpoint, shared credentials, a
-- future client-side client), they get zero rows. Without RLS, those paths
-- would return all rows. This is defense-in-depth.
--
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard
-- → SQL Editor → New query → paste → Run).
--
-- Idempotent: re-running does nothing if RLS is already on.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submitted_applications ENABLE ROW LEVEL SECURITY;

-- Sanity-check after running: should return rowsecurity=true on every row.
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'profiles', 'profile_answers', 'profile_uploads',
--     'job_applications', 'application_questions',
--     'application_answers', 'submitted_applications'
--   );
