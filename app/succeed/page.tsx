import { auth } from "@clerk/nextjs/server";
import { listSubmittedApplications } from "@/lib/submitted-applications";

function formatAppliedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function SucceedPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="page-shell">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Succeed</p>
            <h1 className="page-title">Submitted applications live here.</h1>
            <p className="page-copy">
              Sign in first, then submitted roles will appear here with role,
              link, city, and application date.
            </p>
          </div>
        </section>
      </main>
    );
  }

  let applications = [] as Awaited<ReturnType<typeof listSubmittedApplications>>;
  let errorMessage: string | null = null;

  try {
    applications = await listSubmittedApplications(userId);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load submitted applications.";
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Succeed</p>
          <h1 className="page-title">Track every application you sent.</h1>
          <p className="page-copy">
            This page should become the submission history: role, link,
            location, and the exact date you applied.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Submitted</span>
            <strong>{applications.length}</strong>
          </div>
          <div className="summary-card">
            <span>Latest status</span>
            <strong>{applications.length > 0 ? "Saved" : "Waiting"}</strong>
          </div>
          <div className="summary-card">
            <span>ATS sources</span>
            <strong>2</strong>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Submitted history</p>
            <h2>Saved after each final application.</h2>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--peach)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--ink)]">{errorMessage}</p>
          </div>
        ) : null}

        {!errorMessage && applications.length > 0 ? (
          <div className="table-list">
            {applications.map((application) => (
              <article key={application.id} className="table-row">
                <div>
                  <h3>{application.jobTitle}</h3>
                  <p>{application.companyName}</p>
                </div>
                <span>{application.location ?? "Location pending"}</span>
                <span>{formatAppliedDate(application.appliedAt)}</span>
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="status-pill"
                >
                  Open link
                </a>
              </article>
            ))}
          </div>
        ) : null}

        {!errorMessage && applications.length === 0 ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--muted)]">
              No submitted applications yet. Finish one application and press
              submit from its detail page to save it here.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
