# Demo URLs

A short list of Greenhouse and Lever job postings vetted for the JobPilot demo.
URLs are added here only after they have been confirmed to (a) load in `/apply`,
(b) parse cleanly into a draft application, and (c) surface posting questions
where applicable. Re-verify each entry before the project fair.

## Greenhouse

| Company | Role | URL | Last verified |
|---|---|---|---|
| Anthropic | Anthropic Fellows Program | https://job-boards.greenhouse.io/anthropic/jobs/5023394008 | 2026-05-05 |
| | | | |
| | | | |
| | | | |
| | | | |

## Lever

| Company | Role | URL | Last verified |
|---|---|---|---|
| _(populate during smoke test)_ | _(SWE intern / new-grad)_ | https://jobs.lever.co/... | YYYY-MM-DD |
| | | | |
| | | | |
| | | | |
| | | | |

## How to verify a URL

1. Sign in to https://job-ai-seven-alpha.vercel.app.
2. Paste the URL into `/apply`. It should accept the link without error.
3. Confirm the resulting application detail page shows the company, role, and
   job description correctly.
4. For Greenhouse postings: confirm any posting questions appear in the
   "Application questions" block.
5. Click "Generate cover letter". Even with the V2 placeholder, the assembled
   prompt logged to Vercel Functions should contain the resume text + the
   posting's job description.

If all four steps succeed, fill in the row above.
