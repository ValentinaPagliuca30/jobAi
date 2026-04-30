import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listApplicationAnswers } from "@/lib/application-answers";
import { getJobApplicationById } from "@/lib/job-applications";
import { listProfileUploads } from "@/lib/profile-uploads";
import { loadProfileForUser } from "@/lib/profile-store";
import { answerBlockDefinitions } from "@/lib/profile";
import { ApplicationPrep } from "./application-prep";
import { SubmitApplicationButton } from "./submit-application-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardDescription>Application detail</CardDescription>
            <CardTitle className="text-2xl">
              Sign in to view this application.
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const application = await getJobApplicationById(userId, id);

  if (!application) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardDescription>Application detail</CardDescription>
            <CardTitle className="text-2xl">Application not found.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No record exists for{" "}
              <code className="text-xs">{id}</code>. Start a new draft from{" "}
              <Link href="/apply" className="underline">
                /apply
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [profile, allUploads, savedAnswers] = await Promise.all([
    loadProfileForUser(userId),
    listProfileUploads(userId),
    listApplicationAnswers({ clerkUserId: userId, applicationId: id }),
  ]);

  const resumeOptions = allUploads.filter(
    (upload) => upload.kind === "resume",
  );
  const writingSamples = allUploads.filter(
    (upload) =>
      upload.kind === "writing_sample" || upload.kind === "cover_letter_sample",
  );

  const profilePreviewFields: Array<{ label: string; value: string }> = [
    { label: "Full name", value: profile.basicInfo.fullName },
    { label: "Email", value: profile.basicInfo.email },
    { label: "Phone", value: profile.basicInfo.phone },
    { label: "Location", value: profile.basicInfo.location },
    { label: "School", value: profile.basicInfo.school },
    { label: "Degree", value: profile.basicInfo.degree },
    { label: "Program", value: profile.basicInfo.program },
    { label: "Graduation", value: profile.basicInfo.graduationDate },
    { label: "Work auth", value: profile.basicInfo.workAuthorization },
    { label: "LinkedIn", value: profile.basicInfo.linkedinUrl },
    { label: "GitHub", value: profile.basicInfo.githubUrl },
    { label: "Portfolio", value: profile.basicInfo.portfolioUrl },
  ];

  const filledFields = profilePreviewFields.filter((f) => f.value.trim() !== "");
  const missingFields = profilePreviewFields.filter(
    (f) => f.value.trim() === "",
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="text-sm text-muted-foreground">
        <Link href="/drafts" className="hover:underline">
          Drafts
        </Link>
        <span className="mx-2">/</span>
        <span>{application.companyName || "Application"}</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Badge variant="outline">
                {application.atsType ?? "Application"}
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">
                {application.jobTitle || "Untitled role"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {application.companyName || "Company TBD"}
                {application.location ? ` · ${application.location}` : ""}
              </p>
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground underline"
              >
                Open posting ↗
              </a>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="warning">
                Status: {application.status.replace(/_/g, " ")}
              </Badge>
              <SubmitApplicationButton applicationId={application.id} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile preview</CardTitle>
            <CardDescription>
              These values come from your{" "}
              <Link href="/profile" className="underline">
                profile
              </Link>{" "}
              and will be used to autofill standard fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {filledFields.length > 0 ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {filledFields.map((field) => (
                  <div
                    key={field.label}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <dt className="text-xs text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-sm font-medium">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Your profile is empty. Fill it in on{" "}
                <Link href="/profile" className="font-medium underline">
                  Profile
                </Link>{" "}
                so it can be reused here.
              </p>
            )}

            {missingFields.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Missing: {missingFields.map((f) => f.label).join(", ")}.
              </p>
            ) : null}

            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Reusable answers from profile
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {answerBlockDefinitions.map((block) => {
                  const value = profile.applicationAnswers[block] ?? "";
                  return (
                    <li
                      key={block}
                      className="rounded-md border border-border bg-background px-3 py-2"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {block}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm">
                        {value.trim() === "" ? (
                          <span className="text-muted-foreground/60">
                            — empty —
                          </span>
                        ) : (
                          value
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {writingSamples.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Writing samples available
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {writingSamples.map((sample) => (
                    <li
                      key={sample.id}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                    >
                      <span className="truncate text-sm">
                        {sample.originalFilename}
                      </span>
                      {sample.downloadUrl ? (
                        <a
                          href={sample.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonClasses("outline", "sm")}
                        >
                          View
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <ApplicationPrep
            applicationId={application.id}
            resumeOptions={resumeOptions}
            initialResumeId={application.selectedResumeId}
            initialAnswers={savedAnswers}
          />

          <Card>
            <CardHeader>
              <CardTitle>Job description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {application.jobDescription || "Job description not captured."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
