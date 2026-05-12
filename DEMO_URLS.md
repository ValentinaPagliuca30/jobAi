# Demo URLs

A short list of Greenhouse and Lever job postings vetted for the JobPilot demo.
URLs are added here only after they have been confirmed to (a) load in `/apply`,
(b) parse cleanly into a draft application, and (c) surface posting questions
where applicable. Re-verify each entry before the project fair — job postings
expire faster than this file does.

## Greenhouse

| Company | Role | URL | Last verified |
|---|---|---|---|
| Anthropic | Anthropic Fellows Program | https://job-boards.greenhouse.io/anthropic/jobs/5023394008 | 2026-05-12 |
| Anthropic | STEM Fellow | https://job-boards.greenhouse.io/anthropic/jobs/5189848008 | 2026-05-12 |
| Discord | Software Engineer, Core Product | https://job-boards.greenhouse.io/discord/jobs/8520965002 | 2026-05-12 |
| Discord | Software Engineer, Safety Experience | https://job-boards.greenhouse.io/discord/jobs/8475544002 | 2026-05-12 |
| Vercel | Software Engineer, Next.js | https://job-boards.greenhouse.io/vercel/jobs/5993753004 | 2026-05-12 |
| Vercel | Software Engineer, AI Gateway | https://job-boards.greenhouse.io/vercel/jobs/5798406004 | 2026-05-12 |
| Vercel | Software Engineer, Backend | https://job-boards.greenhouse.io/vercel/jobs/5430088004 | 2026-05-12 |

URLs above were spot-checked via WebFetch on 2026-05-12 and the postings were
live at that time. They were not yet pushed through the full `/apply` flow on
the live app — do that before the fair (see "How to verify" below).

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
| Eventbrite | _SWE — find a current opening at https://jobs.lever.co/eventbrite_ | _(paste from board)_ | _(YYYY-MM-DD)_ |

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
