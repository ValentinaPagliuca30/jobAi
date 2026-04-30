import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteProfileUpload } from "@/lib/profile-uploads";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to remove uploads." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    await deleteProfileUpload({ clerkUserId: userId, uploadId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/profile/uploads/[id] failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete upload.",
      },
      { status: 500 },
    );
  }
}
