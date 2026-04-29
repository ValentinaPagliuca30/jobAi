# JobPilot Build Plan

## Goal
Build a demoable MVP of JobPilot that supports:
- profile setup
- job URL intake
- 3-question calibration
- AI draft generation
- Greenhouse/Lever autofill via Playwright
- review before submit
- application history

The target is not "fully autonomous job application for everything."
The target is: reliable ATS autofill plus high-quality editable drafts for SWE internship/new-grad roles.

## Product Scope

### In Scope for MVP
- Authenticated user flow
- Resume upload
- Writing sample upload
- Structured profile form
- Paste Greenhouse or Lever URL
- Parse job metadata
- Ask 3 calibration questions
- Generate cover letter + short-answer drafts
- Preview/edit responses before submit
- Playwright autofill for standard fields
- Save application history

### Out of Scope for MVP
- Workday
- Ashby
- LinkedIn Easy Apply
- Generic browser agent
- Batch queue
- Gmail integration
- Automatic submission without review

## Architecture

### Frontend
- Next.js app router
- Tailwind for UI
- Clerk for auth

Main pages:
- `/`
- `/dashboard`
- `/onboarding`
- `/apply`
- `/applications/[id]`

### Backend/Data
- Supabase Postgres
- Supabase Storage for resumes and writing samples

Core tables:
- `profiles`
- `writing_samples`
- `job_applications`
- `application_answers`

### AI Layer
- Single server-side generation module
- Inputs:
  - user profile
  - resume text
  - writing samples
  - job description
  - 3 calibration answers
- Outputs:
  - cover letter draft
  - short-answer drafts
  - optional job-fit summary

### Automation Layer
- Playwright worker running locally during demo
- Support only:
  - Greenhouse
  - Lever

Worker responsibilities:
- open job URL
- detect ATS type
- extract visible form fields
- fill standard inputs
- upload resume
- stop before final submit unless user explicitly confirms

## MVP User Flow
1. User signs in.
2. User completes onboarding profile.
3. User uploads resume and 2-3 writing samples.
4. User pastes a Greenhouse or Lever URL.
5. App parses company, role, and description.
6. App asks 3 calibration questions.
7. AI generates draft cover letter and short-answer responses.
8. User edits drafts in review UI.
9. User launches Playwright autofill.
10. Worker fills standard form fields.
11. User reviews final state and submits.
12. Application is saved in history.

## Data Model

### `profiles`
- `id`
- `user_id`
- `full_name`
- `email`
- `phone`
- `location`
- `linkedin_url`
- `github_url`
- `portfolio_url`
- `school`
- `degree`
- `major`
- `graduation_date`
- `work_authorization`
- `needs_sponsorship`
- `created_at`
- `updated_at`

### `writing_samples`
- `id`
- `user_id`
- `title`
- `file_path`
- `raw_text`
- `created_at`

### `job_applications`
- `id`
- `user_id`
- `company_name`
- `job_title`
- `job_url`
- `ats_type`
- `job_description`
- `status`
- `calibration_q1`
- `calibration_q2`
- `calibration_q3`
- `cover_letter_draft`
- `created_at`
- `updated_at`

### `application_answers`
- `id`
- `application_id`
- `question_text`
- `answer_draft`
- `answer_edited`
- `created_at`

## Milestones

### Milestone 1: App Skeleton
Deliverables:
- Next.js app initialized
- Clerk auth working
- Tailwind setup
- dashboard shell
- onboarding page shell

Definition of done:
- user can sign in and land on dashboard

### Milestone 2: Onboarding + Storage
Deliverables:
- profile form
- resume upload
- writing sample upload
- Supabase schema

Definition of done:
- user data persists correctly

### Milestone 3: Job Intake
Deliverables:
- paste URL form
- ATS detection for Greenhouse/Lever
- basic job scraping/parser
- application record creation

Definition of done:
- app stores parsed job metadata from supported URLs

### Milestone 4: AI Drafting
Deliverables:
- 3-question calibration flow
- prompt assembly from profile + resume + samples + job description
- cover letter generation
- short-answer generation

Definition of done:
- user receives editable draft outputs for a supported posting

### Milestone 5: Review UI
Deliverables:
- editable text areas for generated content
- save edits
- application detail page

Definition of done:
- user can revise and save all generated materials

### Milestone 6: Playwright Autofill
Deliverables:
- local worker
- Greenhouse form fill
- Lever form fill
- resume upload
- stop before final submit

Definition of done:
- worker autofills standard fields on curated test jobs

### Milestone 7: Demo Hardening
Deliverables:
- history dashboard
- error states
- loading states
- known-good demo job URLs
- backup recording

Definition of done:
- repeatable end-to-end demo path

## Suggested Build Order
1. Set up Next.js app
2. Set up Clerk
3. Set up Supabase schema/storage
4. Build onboarding form
5. Build job URL intake
6. Build Greenhouse/Lever parsers
7. Build AI draft endpoint
8. Build review screen
9. Build Playwright worker
10. Add history dashboard
11. Polish demo path

## Technical Notes

### Parsing Strategy
Do not start with general web extraction.
Start with ATS-specific parsers:
- Greenhouse: predictable structure
- Lever: predictable structure

Extract only what you need:
- company
- title
- location
- description text
- custom questions if available

### Draft Quality Strategy
To avoid canned output:
- pass resume text, not just file upload
- use 2-3 writing samples
- ask calibration questions before generation
- keep output length constrained
- prefer "editable draft" wording everywhere in the UI

### Demo Strategy
For final demo:
- prepare 3-5 known-good Greenhouse/Lever links
- keep one backup demo recording
- stop automation before final submit if submission risk is high
- if needed, use a controlled test posting or dry-run mode

## Risks and Mitigations

### Risk: weak AI writing
Mitigation:
- narrow job scope
- use writing samples
- require human editing
- optimize prompts for concise, credible language

### Risk: flaky automation
Mitigation:
- support only Greenhouse and Lever
- curate test URLs
- avoid generic browser agent scope

### Risk: time overruns
Mitigation:
- ship autofill + drafts before advanced matching
- treat batch mode and Ashby as extras

## If Time Allows
- job-fit score
- draft style control
- mobile polish
- Ashby support

## Immediate Next Step
Scaffold the app in this folder with:
- Next.js
- Tailwind
- Clerk
- Supabase
- a minimal dashboard/onboarding/apply flow
