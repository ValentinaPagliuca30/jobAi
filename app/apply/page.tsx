"use client";

import Link from "next/link";
import { FormEvent, startTransition, useEffect, useState } from "react";
import { parseJobPostingUrl, type ParsedJobPosting } from "@/lib/job-url";

const checklist = [
  "Paste a supported Greenhouse or Lever URL",
  "Create an application draft from the posting",
  "Answer calibration questions",
  "Review and continue in the draft detail page",
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
  const [jobUrl, setJobUrl] = useState(
    "https://jobs.lever.co/example/software-engineer-intern",
  );
  const [parsedPosting, setParsedPosting] = useState<ParsedJobPosting | null>(
    parseJobPostingUrl("https://jobs.lever.co/example/software-engineer-intern"),
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
    <main className="page-shell">
      <section className="hero-card apply-hero">
        <div>
          <p className="eyebrow">Apply Flow</p>
          <h1 className="page-title">Paste the posting. Keep the rest focused.</h1>
          <p className="page-copy">
            This route will drive the end-to-end demo. The goal is disciplined
            sequencing: intake, calibration, draft generation, review, then
            autofill.
          </p>
        </div>
        <form className="url-card" onSubmit={handleParse}>
          <label>
            Job URL
            <input
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="Paste a Greenhouse or Lever role URL"
            />
          </label>
          <button type="submit" className="cta-primary">
            {isSubmitting ? "Fetching posting..." : "Parse posting"}
          </button>
          <p className="text-sm leading-7 text-[var(--muted)]">
            Supported right now: `jobs.lever.co/...` and `boards.greenhouse.io/...`
          </p>
          {errorMessage ? (
            <p className="rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="content-card">
          <p className="eyebrow">How this works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Keep the first step simple.
          </h2>
          <ul className="feature-list">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Posting intake</p>
              <h2>
                {application
                  ? "Draft created. Continue with calibration."
                  : "Validate the URL before you continue."}
              </h2>
            </div>
          </div>
          {parsedPosting ? (
            <div className="question-stack">
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blue-strong)]">
                  Parsed result
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-[var(--muted)]">ATS</p>
                    <strong className="mt-1 block text-lg text-[var(--ink)]">
                      {parsedPosting.atsType}
                    </strong>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Company</p>
                    <strong className="mt-1 block text-lg text-[var(--ink)]">
                      {parsedPosting.companyName ?? "Not detected"}
                    </strong>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Role</p>
                    <strong className="mt-1 block text-lg text-[var(--ink)]">
                      {parsedPosting.roleTitle ?? "Not detected"}
                    </strong>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--muted)]">Status</p>
                    <strong className="mt-1 block text-lg text-[var(--ink)]">
                      {parsedPosting.supported ? "Ready for calibration" : "Needs parser work"}
                    </strong>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 break-all text-[var(--muted)]">
                  {parsedPosting.normalizedUrl}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-soft)] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mint-strong)]">
                  Intake result
                </p>
                {application ? (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm leading-7 text-[var(--muted)]">
                      A draft application was created. If the live posting fetch
                      was incomplete, you can still continue from the draft
                      detail page and fill the missing parts manually.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-sm text-[var(--muted)]">Location</p>
                        <strong className="mt-1 block text-[var(--ink)]">
                          {application.location ?? "Not detected"}
                        </strong>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <p className="text-sm text-[var(--muted)]">Record</p>
                        <strong className="mt-1 block text-[var(--ink)]">
                          {application.status}
                        </strong>
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-[var(--muted)]">
                      {application.jobDescription}
                    </p>
                    <Link
                      href={`/applications/${application.id}`}
                      className="inline-flex rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white"
                    >
                      Continue to draft
                    </Link>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    Once the URL is accepted, JobPilot creates a draft and
                    unlocks the rest of the application flow.
                  </p>
                )}
              </div>

              {application ? (
                <>
                  <label>
                    Why does this company matter to you right now?
                    <textarea placeholder="Keep it specific to product, team, or mission." />
                  </label>
                  <label>
                    Which experience from your resume best matches this role?
                    <textarea placeholder="Pick one concrete project or internship." />
                  </label>
                  <label>
                    What tone should the draft lean toward?
                    <textarea placeholder="Example: concise, grounded, technical, not overly polished." />
                  </label>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
