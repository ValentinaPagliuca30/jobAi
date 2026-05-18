import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listApplicationAnswers } from "@/lib/application-answers";
import { assembleCoverLetterPrompt } from "@/lib/ai-prompts";
import { generateStub } from "@/lib/ai-stub";
import { generateWithClaude, isAnthropicConfigured } from "@/lib/ai-client";
import { describeError } from "@/lib/error";
import { checkReadyToGenerate } from "@/lib/generation-readiness";
import {
  getJobApplicationById,
  setCoverLetterDraft,
} from "@/lib/job-applications";
import { listProfileUploads } from "@/lib/profile-uploads";
import { loadProfileForUser } from "@/lib/profile-store";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to generate drafts." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      applicationId?: string;
    };
    if (!body.applicationId) {
      return NextResponse.json(
        { error: "Missing applicationId." },
        { status: 400 },
      );
    }

    const application = await getJobApplicationById(userId, body.applicationId);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 },
      );
    }

    const [profile, uploads, calibrationAnswers] = await Promise.all([
      loadProfileForUser(userId),
      listProfileUploads(userId),
      listApplicationAnswers({
        clerkUserId: userId,
        applicationId: body.applicationId,
      }),
    ]);

    const readiness = checkReadyToGenerate({ profile, uploads, application });
    if (!readiness.ready) {
      return NextResponse.json(
        { error: readiness.reason, code: readiness.code },
        { status: 400 },
      );
    }

    const resumeUpload =
      uploads.find(
        (u) =>
          u.id === application.selectedResumeId && u.extractionStatus === "ok",
      ) ??
      uploads.find(
        (u) => u.kind === "resume" && u.extractionStatus === "ok",
      ) ??
      null;

    const writingSampleTexts = uploads
      .filter(
        (u) =>
          (u.kind === "writing_sample" || u.kind === "cover_letter_sample") &&
          u.extractionStatus === "ok" &&
          u.extractedText,
      )
      .map((u) => u.extractedText as string);

    const prompt = assembleCoverLetterPrompt({
      profile,
      resumeText: resumeUpload?.extractedText ?? null,
      writingSampleTexts,
      jobApplication: application,
      calibrationAnswers,
    });

    const calibrationFilled = calibrationAnswers.filter(
      (a) => a.questionKey.startsWith("calibration_") && a.content.trim() !== "",
    ).length;

    const stubMeta = {
      applicantName: profile.basicInfo.fullName || undefined,
      company: application.companyName || undefined,
      role: application.jobTitle || undefined,
      resumeChars: resumeUpload?.extractedText?.length ?? 0,
      writingSampleCount: writingSampleTexts.length,
      calibrationFilled,
    };

    let draft: string;
    if (isAnthropicConfigured()) {
      try {
        const result = await generateWithClaude("cover-letter", prompt, {
          maxTokens: 1024,
        });
        draft = result.text;
      } catch (err) {
        console.error(
          "[ai-client] cover-letter generation failed, falling back to stub",
          err,
        );
        draft = generateStub("cover-letter", prompt, stubMeta);
      }
    } else {
      draft = generateStub("cover-letter", prompt, stubMeta);
    }

    const updated = await setCoverLetterDraft({
      clerkUserId: userId,
      applicationId: body.applicationId,
      draft,
    });

    return NextResponse.json({
      draft,
      generatedAt: updated.coverLetterGeneratedAt,
    });
  } catch (error) {
    console.error("POST /api/generate/cover-letter failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
