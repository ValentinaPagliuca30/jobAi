# JobPilot V1 Handoff

## Snapshot
- Repo path: `/Users/valepagliu/Desktop/finalProject`
- App path: `/Users/valepagliu/Desktop/finalProject/web`
- Stack in use:
  - Next.js App Router
  - Clerk for auth
  - Supabase for DB
- Local app runs on `http://localhost:3000`

## What Works
- Clerk is integrated in keyless mode.
- Top nav for signed-in users exists:
  - `Dashboard`
  - `Succeed`
  - `Drafts`
  - `Profile`
- Supabase env vars are set in `web/.env.local`.
- `Dashboard` no longer crashes after aligning `job_applications`.
- `Succeed` page exists and reads from `submitted_applications`.
- `Drafts` page exists and shows unfinished applications.
- `Apply` page accepts supported URL formats:
  - `jobs.lever.co/...`
  - `boards.greenhouse.io/...`
- Home `Start application` now forwards entered URL to `/apply`.

## Main Current Problem
- `Profile` still does not save.
- UI shows: `Failed to save the profile.`

## Exact Current Profile Failure
Recent debugging found multiple schema mismatches between code and Supabase.

### Confirmed schema situation
`profiles` currently has columns like:
- `id`
- `user_id`
- `full_name`
- `preferred_name`
- `phone`
- `location`
- `linkedin_url`
- `github_url`
- `portfolio_url`
- `school`
- `degree`
- `program`
- `graduation_date`
- `work_authorization`
- `sponsorship_answer`
- `gender`
- `race_ethnicity`
- `veteran_status`
- `disability_status`
- `created_at`
- `updated_at`

`profile_answers` currently has columns like:
- `id`
- `user_id`
- `answer_key`
- `title`
- `content`
- `created_at`
- `updated_at`
- `clerk_user_id`

### Important mismatch
The code now expects `clerk_user_id`-based ownership.
But the existing schema is still mixed:
- old `user_id` columns still exist
- some newer `clerk_user_id` columns exist
- some queries were migrated, some DB constraints still reflect old structure

### Latest concrete errors seen in server logs
1. `column job_applications.clerk_user_id does not exist`
  - fixed by running the job applications migration

2. `column profiles.email does not exist`
  - avoided by removing `email` from current profile selects

3. `column profile_answers.clerk_user_id does not exist`
  - later screenshot showed `clerk_user_id` does exist in `profile_answers`
  - likely a stale schema cache / partially applied schema / old request timing issue at that moment

4. `null value in column "user_id" of relation "profiles" violates not-null constraint`
  - this is the most important old-schema blocker
  - it means `profiles.user_id` was still enforced while code only writes `clerk_user_id`

## What Was Already Changed In Code

### Auth
- Clerk added with:
  - `proxy.ts`
  - `ClerkProvider` in layout
  - `UserButton`
  - sign-in / sign-up pages

### Profile flow
- `web/app/api/profile/route.ts`
  - uses `auth()` from Clerk
  - intended to save/load by `clerk_user_id`
- `web/app/profile/page.tsx`
  - profile is controlled state
  - save button posts to `/api/profile`
  - UI shows migration warning/failure state

### Applications flow
- `web/app/api/job-intake/route.ts`
  - creates job application records in Supabase
- `web/lib/job-applications.ts`
  - create/list/get/submit/delete application records
- `web/app/drafts/page.tsx`
  - drafts table with `Continue` and `Delete`
- `web/app/succeed/page.tsx`
  - submitted applications table

## SQL Files Created
These files exist in `web/supabase/`:
- `job-applications.sql`
- `job-applications-migration.sql`
- `profile-schema.sql`
- `profile-migration.sql`
- `submitted-applications.sql`

Important: they reflect multiple iterations. The database is not yet cleanly normalized to one final schema.

## Best Diagnosis
The app is currently in an in-between migration state:
- UI and server code now assume Clerk-owned rows via `clerk_user_id`
- Supabase tables were originally designed around `user_id` and an older profile structure
- Because of that, profile persistence is the main broken area

## Best Next Step For Tomorrow
Do not continue patching around individual missing columns.
Instead, choose one final schema and align both DB and code to it.

Recommended choice:
- Keep `clerk_user_id` as the ownership key everywhere for V1
- Stop relying on `user_id` in profile-related tables for now

## Recommended Tomorrow Plan
1. Inspect real Supabase schema table-by-table:
   - `profiles`
   - `profile_answers`
   - `job_applications`
   - `submitted_applications`

2. Decide final V1 ownership model:
   - recommended: `clerk_user_id`

3. Rewrite/clean migration SQL once, instead of incremental patches.

4. Update `profiles` and `profile_answers` so they cleanly support:
   - `clerk_user_id`
   - no blocking `user_id not null` constraint

5. Re-test:
   - load `/profile`
   - save profile
   - create draft from `/apply`
   - view `/dashboard`
   - view `/drafts`
   - submit from detail
   - view `/succeed`

## Suggested Final V1 Schema Direction

### profiles
- `id`
- `clerk_user_id`
- `full_name`
- `preferred_name`
- `phone`
- `location`
- `linkedin_url`
- `github_url`
- `portfolio_url`
- `school`
- `degree`
- `program`
- `graduation_date`
- `work_authorization`
- `sponsorship_answer`
- `gender`
- `race_ethnicity`
- `veteran_status`
- `disability_status`
- `created_at`
- `updated_at`

### profile_answers
- `id`
- `clerk_user_id`
- `answer_key`
- `title`
- `content`
- `created_at`
- `updated_at`

### job_applications
- `id`
- `clerk_user_id`
- `company_name`
- `job_title`
- `job_url`
- `ats_type`
- `job_description`
- `location`
- `status`
- `applied_at`
- `created_at`
- `updated_at`

### submitted_applications
- `id`
- `clerk_user_id`
- `source_application_id`
- `company_name`
- `job_title`
- `job_url`
- `location`
- `ats_type`
- `applied_at`
- `created_at`
- `updated_at`

## Notes About Parsing
- Parser currently recognizes only URL formats, not full ATS ecosystems.
- Adobe / Phenom style links are not supported.
- Lever links may still create weak role names if the posting fetch fails and fallback is used.

## UX Notes
- `Apply` was simplified because previous version was too confusing.
- If live posting fetch fails, code now tries to create a fallback draft from parsed URL metadata.
- This is acceptable for V1 demo flow but still rough.

## If Restarting Work Tomorrow
Start from:
- `web/app/api/profile/route.ts`
- `web/app/profile/page.tsx`
- Supabase table definitions for `profiles` and `profile_answers`

Then validate with real manual test in browser before touching more UI.
