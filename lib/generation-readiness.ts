// Prerequisite check shared by the cover-letter and answer generation routes
// (and surfaced in the application detail UI) so the Generate buttons never
// silently fall through to the stub on an empty account.

import type { JobApplicationRecord } from "@/lib/job-applications";
import type { PersistedProfilePayload } from "@/lib/profile";
import type { ProfileUploadRecord } from "@/lib/profile-uploads-shared";

export type ReadinessCode = "missing_profile" | "missing_resume";

export type ReadinessResult =
  | { ready: true }
  | { ready: false; code: ReadinessCode; reason: string };

export function checkReadyToGenerate(input: {
  profile: PersistedProfilePayload;
  uploads: ProfileUploadRecord[];
  application?: JobApplicationRecord | null;
}): ReadinessResult {
  const { profile, uploads, application } = input;

  const hasName = profile.basicInfo.fullName.trim() !== "";
  const hasSchool = profile.basicInfo.school.trim() !== "";
  if (!hasName || !hasSchool) {
    return {
      ready: false,
      code: "missing_profile",
      reason:
        "Add your full name and school in Profile → Basic information before generating drafts.",
    };
  }

  function isReady(u: ProfileUploadRecord): boolean {
    return (
      u.extractionStatus === "ok" &&
      (u.extractedText?.trim().length ?? 0) > 0
    );
  }

  const selectedId = application?.selectedResumeId ?? null;
  const hasSelectedReady =
    selectedId !== null &&
    uploads.some((u) => u.id === selectedId && isReady(u));
  const hasAnyReadyResume = uploads.some(
    (u) => u.kind === "resume" && isReady(u),
  );

  if (!hasSelectedReady && !hasAnyReadyResume) {
    return {
      ready: false,
      code: "missing_resume",
      reason:
        "Upload a resume in Profile → Uploads (wait for the ✓ extracted badge) before generating drafts.",
    };
  }

  return { ready: true };
}
