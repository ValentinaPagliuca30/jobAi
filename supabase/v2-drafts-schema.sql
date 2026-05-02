-- V2 migration: editable AI draft + final-edit columns.
-- Apply after job-applications.sql and application-answers.sql have been run.
--
-- Distinction:
--   *_draft       = the (eventually AI-generated) starting point.
--   *_edited (or `content` for answers) = the user's final, post-edit version.

alter table public.job_applications
  add column if not exists cover_letter_draft text,
  add column if not exists cover_letter_edited text,
  add column if not exists cover_letter_generated_at timestamptz;

alter table public.application_answers
  add column if not exists answer_draft text,
  add column if not exists answer_generated_at timestamptz;
