# Project Proposal: JobPilot

## One-Line Description
An AI-assisted job application tool for CS students that automates standard ATS form filling and generates personalized, editable first drafts for short-answer application responses.

## The Problem
Students applying to internships and new-grad roles often submit dozens or even hundreds of applications in a single recruiting cycle. While tools like Simplify reduce some manual work, the process is still slow and repetitive: users must open each company site, re-enter the same profile details, and write or rewrite custom responses for every application.

The most time-consuming part is not just filling fields. It is producing tailored answers that do not sound generic, robotic, or obviously AI-generated. Poor personalization can actively hurt candidates in a process where signal is already scarce.

As someone currently in this workflow myself, I want to build a tool that reduces repetition without removing human judgment from the final application.

## Target User
Primary users are university students and recent CS grads applying to software engineering internships or new-grad technical roles through common ATS platforms.

Initial target users:
- me
- classmates in MPCS / related technical programs
- students applying to SWE internships and entry-level software roles

## Narrowed Scope
To keep the system reliable and reduce the risk of weak or canned AI outputs, v1 focuses on:

- job type: software engineering internships and new-grad software roles
- ATS platforms: Greenhouse and Lever only
- application flow: autofill standard fields + generate editable drafts for cover letters and short-answer questions
- user role: human remains in the loop before final submission

This narrower scope increases the chance that generated outputs are relevant, credible, and actually useful.

## Core Features (v1)
1. **Profile setup (one time)**
   Users upload a resume, provide standard job application data, and add 2-3 past writing samples or cover letters.

2. **Paste-URL workflow**
   Users paste a Greenhouse or Lever job posting URL into the app.

3. **Mini-interview for calibration**
   Before generating responses, the system asks 3 short questions about the company, role, or user motivation. This gives the AI specific context and keeps the user involved in the creative step.

4. **ATS autofill**
   A browser automation worker fills in standard fields such as name, email, education, work authorization, and resume upload.

5. **Draft generation for custom responses**
   The system generates a tailored cover letter and first-draft responses for short-answer questions in the user's voice, based on their profile, resume, and prior writing samples.

6. **Review before submit**
   Users review and edit all generated content before submission. The system is designed to support judgment, not replace it.

7. **Application history dashboard**
   Users can view previously processed applications with job URL, company, date, and submission status.

## Tech Stack
- **Frontend:** Next.js 15 + Tailwind CSS
- **Authentication:** Clerk
- **Database / Storage:** Supabase (Postgres + file storage for resumes and writing samples)
- **AI layer:** model-agnostic abstraction, with a low-cost default option
- **Browser automation:** Playwright in a Node worker
- **Deployment:** Vercel for frontend, local worker during development/demo

## Why This Project Matters
This project is not just about automation. It explores a more realistic question:

How can AI reduce the repetitive cost of job applications without producing low-quality, generic writing that makes applicants look worse?

That makes the project interesting from both a product and design perspective. It is not enough for the system to work mechanically. It also has to produce outputs that feel believable, useful, and worth sending.

## Biggest Risk
The biggest risk is content quality, not browser automation.

If the generated responses sound generic, overly polished, or inconsistent with the applicant's actual voice, the tool may create false negatives in a process where positives are already hard to win. Recruiters are increasingly sensitive to generic AI-generated writing, especially in "Why us?" and behavioral prompts.

### Mitigations
- narrow platform scope to Greenhouse and Lever
- narrow job scope to SWE internship / new-grad roles
- use writing samples to anchor tone and style
- add a 3-question calibration step before generation
- require human review before final submission

## Stretch Goals
If the core workflow works reliably, the next features I would consider are:

- **Job fit score before applying**
  Estimate whether the role is a reasonable match before generating materials.

- **Draft style control**
  Let users choose between more conservative vs more assertive rewriting.

- **Batch queue**
  Paste several URLs and prepare draft applications in sequence.

- **Ashby support**
  Add one additional ATS after Greenhouse and Lever are stable.

## Week 5 Goal
A live end-to-end demo where a user:

1. signs up
2. uploads resume + writing samples
3. pastes a Greenhouse or Lever SWE job URL
4. answers 3 short calibration questions
5. watches the system autofill standard fields
6. reviews AI-generated drafts for the cover letter and short-answer responses
7. edits and submits the final application
8. sees the result logged in a history dashboard

## Success Criteria
- the system successfully autofills standard application fields on most test Greenhouse and Lever jobs
- generated drafts are good enough to edit rather than rewrite from scratch
- outputs feel personalized to the applicant and role
- the app is usable in a live demo without requiring manual intervention at every step

## Evaluation Plan
I would evaluate success using a curated set of real Greenhouse and Lever postings and judge the system on two dimensions:

1. **Automation reliability**
   Can it consistently parse and fill the application flow?

2. **Draft usefulness**
   Are the generated answers sendable with light edits, or do they still require a full rewrite?

A successful project is one where AI meaningfully reduces application effort while preserving user control and writing quality.
