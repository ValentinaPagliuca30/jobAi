import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteJobApplication } from "@/lib/job-applications";

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
    const message =
      error instanceof Error ? error.message : "Failed to delete the draft.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
