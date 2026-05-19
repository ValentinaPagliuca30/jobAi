import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listApplicationAnswers } from "@/lib/application-answers";
import { listApplicationQuestions } from "@/lib/application-questions-store";
import { checkReadyToGenerate } from "@/lib/generation-readiness";
import { getJobApplicationById } from "@/lib/job-applications";
import { listProfileUploads } from "@/lib/profile-uploads";
import { loadProfileForUser } from "@/lib/profile-store";
import { ApplicationPrep } from "./application-prep";
import { ApplicationQuestions } from "./application-questions";
import { AutofillInstructions } from "./autofill-instructions";
import { CoverLetter } from "./cover-letter";
import { MatchRationale } from "./match-rationale";
import { SubmitApplicationButton } from "./submit-application-button";

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Application detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Sign in to view this application.
            </h1>
          </section>
        </div>
      </main>
    );
  }

  const application = await getJobApplicationById(userId, id);

  if (!application) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Application detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Application not found.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              No record exists for{" "}
              <span className="font-mono text-slate-900">{id}</span>. Start a
              new draft from{" "}
              <Link href="/apply" className="font-medium text-sky-700 underline">
                /apply
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    );
  }

  const [profile, allUploads, savedAnswers, postingQuestions] =
    await Promise.all([
      loadProfileForUser(userId),
      listProfileUploads(userId),
      listApplicationAnswers({ clerkUserId: userId, applicationId: id }),
      listApplicationQuestions({ clerkUserId: userId, applicationId: id }),
    ]);

  const resumeOptions = allUploads.filter(
    (upload) => upload.kind === "resume",
  );

  const readiness = checkReadyToGenerate({
    profile,
    uploads: allUploads,
    application,
  });
  const canGenerate = readiness.ready;
  const generateBlockedReason = readiness.ready ? null : readiness.reason;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 text-sm text-slate-500">
          <Link href="/drafts" className="hover:underline">
            Drafts
          </Link>
          <span className="mx-2">/</span>
          {application.companyName || "Application"}
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                {application.atsType ?? "Application"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                {application.jobTitle || "Untitled role"}
              </h1>
              <p className="mt-2 text-base text-slate-600">
                {application.companyName || "Company TBD"}
                {application.location ? ` · ${application.location}` : ""}
              </p>
              <p className="mt-2 text-sm">
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 underline"
                >
                  Open posting ↗
                </a>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Status: {application.status.replace(/_/g, " ")}
              </span>
              <SubmitApplicationButton applicationId={application.id} />
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Job description
            </p>
            <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {application.jobDescription || "Job description not captured."}
            </p>
          </div>

          <MatchRationale
            applicationId={application.id}
            initialDraft={application.matchRationaleDraft}
            initialGeneratedAt={application.matchRationaleGeneratedAt}
            canGenerate={canGenerate}
            generateBlockedReason={generateBlockedReason}
          />

          <ApplicationPrep
            applicationId={application.id}
            resumeOptions={resumeOptions}
            initialResumeId={application.selectedResumeId}
            initialAnswers={savedAnswers}
          />

          <CoverLetter
            applicationId={application.id}
            initialDraft={application.coverLetterDraft}
            initialEdited={application.coverLetterEdited}
            initialGeneratedAt={application.coverLetterGeneratedAt}
            canGenerate={canGenerate}
            generateBlockedReason={generateBlockedReason}
          />

          <ApplicationQuestions
            applicationId={application.id}
            initialQuestions={postingQuestions}
            initialAnswers={savedAnswers}
            profileAnswers={profile.applicationAnswers}
            canGenerate={canGenerate}
            generateBlockedReason={generateBlockedReason}
          />

          <AutofillInstructions
            applicationId={application.id}
            clerkUserId={userId}
          />

        </div>
      </div>
    </main>
  );
}
