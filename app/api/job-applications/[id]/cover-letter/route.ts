import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { describeError } from "@/lib/error";
import { setCoverLetterEdited } from "@/lib/job-applications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to save a cover letter." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      edited?: string | null;
    };

    const updated = await setCoverLetterEdited({
      clerkUserId: userId,
      applicationId: id,
      edited: typeof body.edited === "string" ? body.edited : null,
    });

    return NextResponse.json({
      coverLetterEdited: updated.coverLetterEdited,
      coverLetterDraft: updated.coverLetterDraft,
      coverLetterGeneratedAt: updated.coverLetterGeneratedAt,
    });
  } catch (error) {
    console.error("POST /api/job-applications/[id]/cover-letter failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
