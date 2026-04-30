import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { replaceApplicationQuestions } from "@/lib/application-questions-store";
import { describeError } from "@/lib/error";
import { getJobApplicationById } from "@/lib/job-applications";
import { fetchPostingFromUrl } from "@/lib/job-questions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to refresh questions." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const application = await getJobApplicationById(userId, id);

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 },
      );
    }

    const posting = await fetchPostingFromUrl(application.jobUrl);

    if (!posting) {
      return NextResponse.json(
        {
          error:
            "Could not fetch questions for this posting. Right now Greenhouse is the only ATS supported for question scraping.",
        },
        { status: 400 },
      );
    }

    const questions = await replaceApplicationQuestions({
      clerkUserId: userId,
      applicationId: id,
      questions: posting.questions,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
