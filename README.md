# JobPilot — Web app

Next.js 16 + Tailwind v4 + Clerk + Supabase. Deployed via Vercel from the `web/` root.

> Heads up: this project pins Next.js 16, which differs from older versions you may know (middleware lives in `proxy.ts`, route handler `params` are `Promise`s). Consult `node_modules/next/dist/docs/` before changing route/page conventions.

## Local setup

```bash
cd web
npm install
cp .env.example .env.local   # then fill in the keys (see "Environment" below)
npm run dev
```

Open http://localhost:3000.

## Environment

`.env.local` needs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Vercel Project Settings should mirror these.

## Database setup (apply in order)

In the Supabase SQL editor, run each file under `web/supabase/`:

1. `profile-schema.sql` — base profile + answers tables
2. `profile-migration.sql` — column adjustments for existing installs
3. `profile-uploads.sql` — `profile_uploads` metadata table
4. `profile-uploads-text.sql` — **V2** adds `extracted_text`, `extraction_status`, `extracted_at`
5. `job-applications.sql` (then `job-applications-migration.sql` if upgrading)
6. `submitted-applications.sql`
7. `application-questions.sql`
8. `application-answers.sql`
9. `v2-drafts-schema.sql` — **V2** adds `cover_letter_draft/edited/generated_at` and `answer_draft/generated_at`
10. `drop-user-fk.sql` — only run if you have an old `user_id` FK constraint to drop

Also create a private Supabase Storage bucket named `user-uploads`.

## V2 features (current)

- Profile basic info + reusable answer blocks (saved per-user via Clerk).
- Resume / writing sample / transcript / cover letter / portfolio uploads, with **text extraction** on PDFs (`pdf-parse`) and DOCX (`mammoth`). Status badge per upload, manual re-extract button.
- Paste a Greenhouse / Lever URL → application draft.
- Application detail page with profile preview, resume picker, 3 calibration questions, scraped posting questions, **editable cover letter** with generate-draft button, **per-question editable answers** with generate-draft button.
- AI generate buttons currently call `/api/generate/cover-letter` and `/api/generate/answer`, which assemble the full prompt (logged to the server console) and return a clearly-marked V2 placeholder.
- Drafts and Succeed tracker tables.

## V3 (next)

- Replace `generateStub(...)` in `app/api/generate/*/route.ts` with `anthropic.messages.create({ model: "claude-sonnet-4-6", system, messages: [...] })`. Prompt assembly already exists in `lib/ai-prompts.ts`.
- Add prompt caching on the system prompt.
- Build a Playwright autofill worker (separate `worker/` directory at repo root, not Vercel-deployed).
- Production Clerk + custom domain.
- Curated demo URL list + backup recording.

## Useful commands

```bash
npm run dev      # local dev server on :3000
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # type-check without emitting JS
```
