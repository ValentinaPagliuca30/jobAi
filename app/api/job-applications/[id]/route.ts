import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { describeError } from "@/lib/error";
import {
  deleteJobApplication,
  setJobApplicationResume,
} from "@/lib/job-applications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You need to sign in before deleting a draft." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    await deleteJobApplication(userId, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to update the application." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      selectedResumeId?: string | null;
    };

    const application = await setJobApplicationResume({
      clerkUserId: userId,
      applicationId: id,
      resumeId: body.selectedResumeId ?? null,
    });

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
