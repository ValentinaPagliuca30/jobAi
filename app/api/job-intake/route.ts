import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { parseJobPostingUrl } from "@/lib/job-url";
import { fetchJobPostingSnapshot } from "@/lib/job-intake";
import { createJobApplication } from "@/lib/job-applications";
import { fetchPostingFromUrl } from "@/lib/job-questions";
import { replaceApplicationQuestions } from "@/lib/application-questions-store";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You need to sign in before starting an application." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { jobUrl?: string };
    const jobUrl = body.jobUrl?.trim();

    if (!jobUrl) {
      return NextResponse.json(
        { error: "A job URL is required." },
        { status: 400 },
      );
    }

    const parsed = parseJobPostingUrl(jobUrl);

    if (!parsed.supported || parsed.atsType === "unknown") {
      return NextResponse.json(
        {
          error:
            "This URL is not supported yet. Right now JobPilot only works with Greenhouse and Lever links.",
        },
        { status: 400 },
      );
    }

    let snapshot: {
      atsType: "greenhouse" | "lever";
      normalizedUrl: string;
      companyName: string;
      roleTitle: string;
      description: string;
      location: string | null;
    };

    try {
      snapshot = await fetchJobPostingSnapshot(jobUrl);
    } catch {
      snapshot = {
        atsType: parsed.atsType,
        normalizedUrl: parsed.normalizedUrl,
        companyName: parsed.companyName ?? "Unknown company",
        roleTitle: parsed.roleTitle ?? "Role title unavailable",
        description:
          "JobPilot could not fetch the full posting content from this page, but the application draft was created from the URL so you can keep going.",
        location: null,
      };
    }

    const application = await createJobApplication({
      clerkUserId: userId,
      companyName: snapshot.companyName,
      jobTitle: snapshot.roleTitle,
      jobUrl: snapshot.normalizedUrl,
      jobDescription: snapshot.description,
      location: snapshot.location,
      atsType: snapshot.atsType,
    });

    // Best-effort: pull the application questions from the ATS so the user
    // sees them on the detail page. Failures here should not block intake.
    try {
      const posting = await fetchPostingFromUrl(snapshot.normalizedUrl);
      if (posting && posting.questions.length > 0) {
        await replaceApplicationQuestions({
          clerkUserId: userId,
          applicationId: application.id,
          questions: posting.questions,
        });
      }
    } catch (questionError) {
      console.warn("Question scrape failed", questionError);
    }

    return NextResponse.json({
      application: {
        id: application.id,
        atsType: application.atsType,
        companyName: application.companyName,
        roleTitle: application.jobTitle,
        jobUrl: application.jobUrl,
        jobDescription: application.jobDescription,
        location: application.location,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/job-intake failed", error);
    const message =
      error instanceof Error
        ? error.message
        : "The posting could not be parsed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
