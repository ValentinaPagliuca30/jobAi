"use client";

import Link from "next/link";
import { FormEvent, startTransition, useEffect, useState } from "react";
import { parseJobPostingUrl, type ParsedJobPosting } from "@/lib/job-url";

const checklist = [
  "Paste a supported Greenhouse or Lever URL",
  "Create an application draft from the posting",
  "Pick the resume and answer 3 calibration questions",
  "Continue from the draft detail page",
];

type IntakeApplication = {
  id: string;
  atsType: "greenhouse" | "lever";
  companyName: string;
  roleTitle: string;
  jobUrl: string;
  jobDescription: string;
  location: string | null;
  status: string;
  createdAt: string;
};

export default function ApplyPage() {
  const [jobUrl, setJobUrl] = useState("");
  const [parsedPosting, setParsedPosting] = useState<ParsedJobPosting | null>(
    null,
  );
  const [application, setApplication] = useState<IntakeApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefilledJobUrl = params.get("jobUrl") ?? "";

    if (!prefilledJobUrl) {
      return;
    }

    const parsed = parseJobPostingUrl(prefilledJobUrl);
    const nextErrorMessage = !parsed.normalizedUrl
      ? "Paste a Greenhouse or Lever posting URL to continue."
      : !parsed.supported
        ? "This URL is not supported yet. Right now JobPilot only works with Greenhouse and Lever links."
        : null;

    startTransition(() => {
      setJobUrl(prefilledJobUrl);
      setParsedPosting(parsed);
      setErrorMessage(nextErrorMessage);
    });
  }, []);

  async function handleParse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseJobPostingUrl(jobUrl);
    setApplication(null);

    if (!parsed.normalizedUrl) {
      setParsedPosting(null);
      setErrorMessage("Paste a Greenhouse or Lever posting URL to continue.");
      return;
    }

    if (!parsed.supported) {
      setParsedPosting(parsed);
      setErrorMessage(
        "This URL is not supported yet. Right now JobPilot only works with Greenhouse and Lever links.",
      );
      return;
    }

    setParsedPosting(parsed);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/job-intake", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ jobUrl: parsed.normalizedUrl }),
      });

      const payload = (await response.json()) as {
        application?: IntakeApplication;
        error?: string;
      };

      if (!response.ok || !payload.application) {
        throw new Error(payload.error || "The posting could not be parsed.");
      }

      setApplication(payload.application);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The posting could not be parsed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          Apply
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Apply Flow
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Paste the posting. Keep the rest focused.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            One link in. We parse the company and role, create a draft, and
            unlock calibration so the application can use your saved profile.
          </p>

          <form onSubmit={handleParse} className="mt-8 grid gap-3">
            <label className="block text-sm font-medium text-slate-800">
              Job URL
              <input
                value={jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                placeholder="https://boards.greenhouse.io/... or https://jobs.lever.co/..."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Fetching posting…" : "Parse posting"}
              </button>
              <p className="text-xs text-slate-500">
                Supported: <code>jobs.lever.co/...</code> and{" "}
                <code>boards.greenhouse.io/...</code>
              </p>
            </div>
            {errorMessage ? (
              <p className="rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              How this works
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Keep the first step simple.
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {checklist.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Posting intake
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {application
                    ? "Draft created. Continue with calibration."
                    : "Validate the URL before you continue."}
                </h2>
              </div>
            </div>

            {parsedPosting ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Parsed result
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">ATS</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {parsedPosting.atsType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Company
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {parsedPosting.companyName ?? "Not detected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Role</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {parsedPosting.roleTitle ?? "Not detected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Status
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {parsedPosting.supported
                          ? "Ready for calibration"
                          : "Needs parser work"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 break-all text-xs text-slate-500">
                    {parsedPosting.normalizedUrl}
                  </p>
                </div>

                {application ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Draft created
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">
                          Location
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {application.location ?? "Not detected"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">
                          Record
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {application.status}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-700">
                      {application.jobDescription}
                    </p>
                    <Link
                      href={`/applications/${application.id}`}
                      className="mt-5 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Continue to draft →
                    </Link>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
                    Once the URL is accepted, JobPilot creates a draft and
                    unlocks the rest of the application flow.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Paste a posting URL above to see the parsed result here.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
