# Demo URLs

A short list of Greenhouse and Lever job postings vetted for the JobPilot demo.
URLs are added here only after they have been confirmed to (a) load in `/apply`,
(b) parse cleanly into a draft application, and (c) surface posting questions
where applicable. Re-verify each entry before the project fair — job postings
expire faster than this file does.

## Greenhouse — SWE Internships (Summer/Fall 2026)

The target demo flow. All URLs use the new `job-boards.greenhouse.io` host that
JobPilot supports out of the box.

| Company | Role | URL | Last verified |
|---|---|---|---|
| Verkada | Frontend Software Engineering Intern — Fall 2026 (San Mateo) | https://job-boards.greenhouse.io/verkada/jobs/5099529007 | 2026-05-19 |
| Verkada | Backend Software Engineering Intern — Fall 2026 | https://job-boards.greenhouse.io/verkada/jobs/5099422007 | 2026-05-19 |
| Cloudflare | Software Engineer Intern — Summer 2026 (Austin, TX) | https://job-boards.greenhouse.io/cloudflare/jobs/7206269 | 2026-05-19 |
| Affirm | Software Engineering Intern — Summer 2026 | https://job-boards.greenhouse.io/affirm/jobs/7528020003 | 2026-05-19 |
| SpaceX | Summer 2026 Software Engineering Internship / Co-op | https://job-boards.greenhouse.io/spacex/jobs/8149154002 | 2026-05-19 |
| Mercury | Software Engineering Intern — AI Enablement (Fall 2026, remote) | https://job-boards.greenhouse.io/mercury/jobs/5817107004 | 2026-05-19 |

## Greenhouse — AI / Research (full-time + fellowships)

Useful for showing JobPilot on non-intern roles too.

| Company | Role | URL | Last verified |
|---|---|---|---|
| Anthropic | Anthropic Fellows Program | https://job-boards.greenhouse.io/anthropic/jobs/5023394008 | 2026-05-12 |
| Anthropic | STEM Fellow | https://job-boards.greenhouse.io/anthropic/jobs/5189848008 | 2026-05-12 |
| Discord | Software Engineer, Core Product | https://job-boards.greenhouse.io/discord/jobs/8520965002 | 2026-05-12 |
| Vercel | Software Engineer, Next.js | https://job-boards.greenhouse.io/vercel/jobs/5993753004 | 2026-05-12 |

## Lever

Lever's public boards (`jobs.lever.co/<company>`) return HTTP 403 to scripted
fetches, so the URLs below are listed as **candidates for manual verification**
rather than pre-confirmed. The parser in `web/lib/job-url.ts` already handles
the `jobs.lever.co/<company>/<uuid>` shape — paste any of these into `/apply`
in the live app, confirm the posting is still open, then fill in the row.

| Company | Role | URL | Last verified |
|---|---|---|---|
| Plaid | _SWE — find a current opening at https://jobs.lever.co/plaid_ | _(paste from board)_ | _(YYYY-MM-DD)_ |
| Brex | _SWE — find a current opening at https://jobs.lever.co/brex_ | _(paste from board)_ | _(YYYY-MM-DD)_ |

## Demo script (live fair)

Pick one row from the SWE Internships table and walk through it end-to-end:

1. Sign in with a fresh email (Clerk allows it instantly in dev mode).
2. `/profile → Uploads`: upload a real resume PDF, wait for the
   "Text extracted" badge.
3. `/profile → Basic info`: fill name, school, degree, program, graduation
   date, GPA, notice period, work auth. Save profile.
4. `/profile → Application answers`: write 2-3 reusable answers (Tell us
   about yourself, Why this role, Why this company).
5. `/apply`: paste the demo URL. JobPilot redirects to the draft detail.
6. `/applications/[id]`: the **Why this match?** rationale auto-generates
   above the resume picker — this is the moment to pause and read it.
7. Fill the 3 calibration answers. Click **Generate cover letter**, edit
   inline, **Save edits**.
8. (Optional) Open the **Autofill the form** section, copy the CLI command,
   and run the worker in a side terminal to demonstrate the autofill.
9. **Mark submitted** → JobPilot redirects to `/succeed`.
10. On `/succeed`, change the row's status to **Interviewing** to show the
    response-tracking dropdown.

If the live deploy glitches at step 6 or 7, fall back to the smoke-test path
on `localhost:3000` (same data, same migrations).

## How to verify a URL

1. Sign in to https://job-ai-seven-alpha.vercel.app.
2. Paste the URL into `/apply`. It should accept the link without error.
3. Confirm the resulting application detail page shows the company, role, and
   job description correctly.
4. For Greenhouse postings: confirm any posting questions appear in the
   "Application questions" block.
5. Click "Generate cover letter". With `ANTHROPIC_API_KEY` set, you should get
   a real draft; without it, you should get the placeholder + the full assembled
   prompt logged in Vercel Functions.

If all five steps succeed, update the row above with today's date.
