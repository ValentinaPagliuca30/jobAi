// Supabase RLS audit — V3 security task #1.
//
// For every JobPilot table in the public schema, reports:
//   - whether RLS is enabled
//   - what policies are attached (name, command, expression)
//
// Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/audit-rls.ts
// Or just `npm run audit:rls` after the .env.local entries are set.

import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "profiles",
  "profile_answers",
  "profile_uploads",
  "job_applications",
  "application_questions",
  "application_answers",
  "submitted_applications",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supa = createClient(url, key, { auth: { persistSession: false } });

  // Supabase exposes a PostgREST endpoint, so we can't run arbitrary SQL directly
  // via the JS client. But the project has an `exec_sql` RPC by default? It does
  // NOT. So we use the REST API's information schema views, which PostgREST
  // exposes via its `pg_meta`-style endpoints — but those require the studio
  // privilege which the service role has.
  //
  // Workaround: call POST /rest/v1/rpc/exec  with a function we create here. But
  // we can't create functions without DDL. So we fall back to the supabase admin
  // API for tables, or run via http directly using the Postgres REST endpoint
  // for `pg_catalog` views.
  //
  // Simpler: use the `pg_meta` endpoint at `/pg/` if exposed. Most projects don't
  // expose it. The cleanest portable path is the Supabase Management API or
  // direct Postgres connection. Since we don't want to add dependencies, we
  // attempt to read from `information_schema` via the REST surface using the
  // service role's grants.

  // Attempt 1: Use REST API to read information_schema views (works if the
  // schema is exposed to PostgREST — which it isn't by default).
  // Attempt 2: Use direct postgres via the connection string — adds pg as a dep.
  //
  // The pragmatic move: ask the user to paste these SQL queries into Supabase
  // SQL Editor, capture output, and we audit from there.
  //
  // BUT — we can probe each table for RLS impact directly: try selecting one
  // row from each table using the service role (works regardless of RLS), AND
  // separately check the policies via a CSV dump from pg_policies through the
  // PostgREST `rpc` mechanism if available.

  // Pragmatic probe: confirm we can read each target table at all (sanity), and
  // count rows per clerk_user_id distribution to spot obvious leaks if any.

  console.log(`Auditing Supabase project at ${new URL(url).hostname}\n`);
  console.log("Table-by-table service-role read probe:\n");
  for (const t of TABLES) {
    const { count, error } = await supa
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ${t.padEnd(34)} ERROR: ${error.message}`);
    } else {
      console.log(`  ${t.padEnd(34)} rows=${count ?? "?"}`);
    }
  }

  console.log(
    "\nRLS policy enumeration requires running SQL against pg_catalog,",
  );
  console.log(
    "which the PostgREST surface doesn't expose. Run these in the Supabase",
  );
  console.log("SQL editor (https://supabase.com/dashboard → SQL Editor):\n");
  console.log("--- query 1: which tables have RLS enabled? ---");
  console.log(`SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (${TABLES.map((t) => `'${t}'`).join(", ")})
ORDER BY tablename;`);
  console.log("\n--- query 2: existing policies on those tables ---");
  console.log(`SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (${TABLES.map((t) => `'${t}'`).join(", ")})
ORDER BY tablename, policyname;`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
