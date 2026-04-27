import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DeleteDraftButton } from "./delete-draft-button";
import { listDraftJobApplications } from "@/lib/job-applications";

function formatDraftDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DraftsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="page-shell">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Drafts</p>
            <h1 className="page-title">Unfinished applications live here.</h1>
            <p className="page-copy">
              Sign in first, then drafts will appear here with continue and
              delete actions.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const drafts = await listDraftJobApplications(userId);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Drafts</p>
          <h1 className="page-title">Resume unfinished applications fast.</h1>
          <p className="page-copy">
            If you do not finish an application, it stays here so you can
            continue later or delete it.
          </p>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Open drafts</span>
            <strong>{drafts.length}</strong>
          </div>
          <div className="summary-card">
            <span>Ready to continue</span>
            <strong>{drafts.length > 0 ? "Yes" : "No"}</strong>
          </div>
          <div className="summary-card">
            <span>Flow state</span>
            <strong>Saved</strong>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Unfinished history</p>
            <h2>Every draft stays editable until you submit it.</h2>
          </div>
          <Link
            href="/apply"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            New draft
          </Link>
        </div>

        {drafts.length > 0 ? (
          <div className="table-list">
            {drafts.map((draft) => (
              <article key={draft.id} className="table-row">
                <div>
                  <h3>{draft.jobTitle}</h3>
                  <p>{draft.companyName}</p>
                </div>
                <span>{draft.location ?? "Location pending"}</span>
                <span>{formatDraftDate(draft.createdAt)}</span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/applications/${draft.id}`}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Continue
                  </Link>
                  <DeleteDraftButton applicationId={draft.id} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--muted)]">
              No drafts yet. Start a new application from `/apply` and unfinished
              records will appear here automatically.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
