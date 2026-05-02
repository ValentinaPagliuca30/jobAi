import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { describeError } from "@/lib/error";
import { reextractProfileUpload } from "@/lib/profile-uploads";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to re-extract uploads." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const upload = await reextractProfileUpload({
      clerkUserId: userId,
      uploadId: id,
    });

    return NextResponse.json({ upload });
  } catch (error) {
    console.error("POST /api/profile/uploads/[id]/reextract failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
