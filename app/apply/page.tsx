"use client";

import Link from "next/link";
import { FormEvent, startTransition, useEffect, useState } from "react";
import { parseJobPostingUrl, type ParsedJobPosting } from "@/lib/job-url";
import { Button, buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        headers: { "content-type": "application/json" },
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Apply flow
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Paste the posting. Keep the rest focused.
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          One link in. We parse the company and role, create a draft, and
          unlock calibration so the application can use your saved profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job intake</CardTitle>
          <CardDescription>
            Supports <code className="text-xs">jobs.lever.co</code> and{" "}
            <code className="text-xs">boards.greenhouse.io</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleParse} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="apply-url">Job URL</Label>
              <Input
                id="apply-url"
                value={jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                placeholder="https://boards.greenhouse.io/... or https://jobs.lever.co/..."
              />
            </div>
            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Fetching posting…" : "Parse posting"}
              </Button>
            </div>
            {errorMessage ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>How this works</CardTitle>
            <CardDescription>Keep the first step simple.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2 text-sm">
              {checklist.map((item, idx) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {application
                ? "Draft created. Continue with calibration."
                : "Validate the URL before you continue."}
            </CardTitle>
            <CardDescription>Posting intake</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {parsedPosting ? (
              <div className="rounded-md border border-border bg-muted/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Parsed result
                </p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ParsedField label="ATS" value={parsedPosting.atsType} />
                  <ParsedField
                    label="Company"
                    value={parsedPosting.companyName ?? "Not detected"}
                  />
                  <ParsedField
                    label="Role"
                    value={parsedPosting.roleTitle ?? "Not detected"}
                  />
                  <ParsedField
                    label="Status"
                    value={
                      parsedPosting.supported
                        ? "Ready for calibration"
                        : "Needs parser work"
                    }
                  />
                </dl>
                <p className="mt-3 break-all text-xs text-muted-foreground">
                  {parsedPosting.normalizedUrl}
                </p>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                Paste a posting URL above to see the parsed result here.
              </p>
            )}

            {application ? (
              <div className="rounded-md border border-success/30 bg-success/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-success">
                  Draft created
                </p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ParsedField
                    label="Location"
                    value={application.location ?? "Not detected"}
                  />
                  <ParsedField label="Record" value={application.status} />
                </dl>
                <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">
                  {application.jobDescription}
                </p>
                <Link
                  href={`/applications/${application.id}`}
                  className={buttonClasses("default", "md", "mt-4")}
                >
                  Continue to draft →
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParsedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
