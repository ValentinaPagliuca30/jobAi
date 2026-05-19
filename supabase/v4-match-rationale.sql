-- V4 feature "Why this match?": store the AI-generated 2-3 sentence
-- rationale that explains why the applicant's profile maps to the role.
-- Mirrors the cover_letter_draft / cover_letter_generated_at pattern.
-- Apply once in the Supabase SQL editor against prod.

alter table public.job_applications
  add column if not exists match_rationale_draft text,
  add column if not exists match_rationale_generated_at timestamptz;
