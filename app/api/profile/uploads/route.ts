import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { describeError } from "@/lib/error";
import {
  createProfileUpload,
  listProfileUploads,
} from "@/lib/profile-uploads";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to load uploads." },
        { status: 401 },
      );
    }

    const uploads = await listProfileUploads(userId);
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("GET /api/profile/uploads failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to upload files." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (typeof kind !== "string") {
      return NextResponse.json(
        { error: "Missing 'kind' field." },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing 'file' field." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`,
        },
        { status: 413 },
      );
    }

    const upload = await createProfileUpload({
      clerkUserId: userId,
      kind,
      file,
    });

    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) {
    console.error("POST /api/profile/uploads failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
