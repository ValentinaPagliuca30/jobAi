import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  listApplicationAnswers,
  setAnswerDraft,
} from "@/lib/application-answers";
import { assembleAnswerPrompt } from "@/lib/ai-prompts";
import { generateStub } from "@/lib/ai-stub";
import { describeError } from "@/lib/error";
import { getJobApplicationById } from "@/lib/job-applications";
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
      questionKey?: string;
      questionText?: string;
    };
    if (!body.applicationId || !body.questionKey || !body.questionText) {
      return NextResponse.json(
        { error: "Missing applicationId, questionKey, or questionText." },
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

    const prompt = assembleAnswerPrompt({
      profile,
      resumeText: resumeUpload?.extractedText ?? null,
      writingSampleTexts,
      jobApplication: application,
      calibrationAnswers,
      question: { text: body.questionText, key: body.questionKey },
    });

    const calibrationFilled = calibrationAnswers.filter(
      (a) => a.questionKey.startsWith("calibration_") && a.content.trim() !== "",
    ).length;

    const draft = generateStub(`answer:${body.questionKey}`, prompt, {
      applicantName: profile.basicInfo.fullName || undefined,
      company: application.companyName || undefined,
      role: application.jobTitle || undefined,
      resumeChars: resumeUpload?.extractedText?.length ?? 0,
      writingSampleCount: writingSampleTexts.length,
      calibrationFilled,
    });

    const updated = await setAnswerDraft({
      clerkUserId: userId,
      applicationId: body.applicationId,
      questionKey: body.questionKey,
      questionText: body.questionText,
      draft,
    });

    return NextResponse.json({
      draft,
      generatedAt: updated.answerGeneratedAt,
    });
  } catch (error) {
    console.error("POST /api/generate/answer failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
