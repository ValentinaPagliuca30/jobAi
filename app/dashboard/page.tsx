import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listJobApplications } from "@/lib/job-applications";

export default async function DashboardPage() {
  const { userId } = await auth();
  let applications = [] as Awaited<ReturnType<typeof listJobApplications>>;
  let errorMessage: string | null = null;

  if (userId) {
    try {
      applications = await listJobApplications(userId);
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard applications.";
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="page-title">Track drafts, reviews, and submissions.</h1>
          <p className="page-copy">
            This screen will become the control center for the final demo:
            application state, generation history, and quick re-entry into the
            review flow.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Open drafts</span>
            <strong>
              {
                applications.filter(
                  (application) => application.status !== "submitted",
                ).length
              }
            </strong>
          </div>
          <div className="summary-card">
            <span>Submitted</span>
            <strong>
              {applications.filter(
                (application) => application.status === "submitted",
              ).length}
            </strong>
          </div>
          <div className="summary-card">
            <span>Supported ATS</span>
            <strong>2</strong>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent applications</p>
            <h2>Curated, narrow, and demo-safe.</h2>
          </div>
          <Link
            href="/apply"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            New intake
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--peach)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--ink)]">
              Dashboard could not load applications yet. Run the SQL in
              `supabase/job-applications-migration.sql` inside Supabase, then
              refresh this page.
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--ink)]">
              Database error: {errorMessage}
            </p>
          </div>
        ) : null}

        {!errorMessage && applications.length > 0 ? (
          <div className="table-list">
            {applications.map((application) => (
              <Link
                key={application.id}
                href={`/applications/${application.id}`}
                className="table-row"
              >
                <div>
                  <h3>{application.companyName}</h3>
                  <p>{application.jobTitle}</p>
                </div>
                <span>{application.atsType}</span>
                <span className="status-pill">{application.status}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {!errorMessage && applications.length === 0 ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--muted)]">
              No demo applications yet. Start from `/apply` to parse a posting
              and create the first record.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
