import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { getJobApplicationById } from "@/lib/job-applications";
import { SubmitApplicationButton } from "./submit-application-button";

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  const application = userId ? await getJobApplicationById(userId, id) : null;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Application detail</p>
          <h1 className="page-title">Review and edit generated materials.</h1>
          <p className="page-copy">
            Application ID: <span className="font-semibold text-[var(--ink)]">{id}</span>
          </p>
          {!application ? (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              No in-memory demo record was found for this ID. Start from{" "}
              <Link href="/apply" className="font-semibold text-sky-700">
                /apply
              </Link>{" "}
              to create one.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr]">
        <div className="content-card">
          <p className="eyebrow">Status</p>
          <ul className="feature-list">
            <li>ATS detected: {application?.atsType ?? "Unknown"}</li>
            <li>Company: {application?.companyName ?? "Missing demo record"}</li>
            <li>Role: {application?.jobTitle ?? "Missing demo record"}</li>
            <li>Status: {application?.status ?? "Start intake first"}</li>
            <li>Autofill not launched yet</li>
          </ul>
          {application ? (
            <SubmitApplicationButton applicationId={application.id} />
          ) : null}
        </div>

        <div className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Job context</p>
              <h2>{application ? "Parsed job description" : "Cover letter draft"}</h2>
            </div>
          </div>
          <label className="editor-block">
            <textarea
              defaultValue={
                application?.jobDescription ??
                `Dear Hiring Team,

I am excited to apply because this role sits at the intersection of product craftsmanship and technical execution. My recent work on full-stack student projects pushed me to build clean interfaces, ship quickly, and adapt to real product constraints.

What stands out to me about this position is the chance to contribute to meaningful user-facing software while continuing to grow as an engineer in a high-feedback environment.`
              }
            />
          </label>
        </div>
      </section>
    </main>
  );
}
