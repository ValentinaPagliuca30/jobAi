import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { describeError } from "@/lib/error";
import {
  isResponseStatus,
  updateSubmittedApplicationStatus,
} from "@/lib/submitted-applications";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to update an application." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      responseStatus?: unknown;
    };

    if (!isResponseStatus(body.responseStatus)) {
      return NextResponse.json(
        { error: "Invalid responseStatus." },
        { status: 400 },
      );
    }

    const updated = await updateSubmittedApplicationStatus({
      clerkUserId: userId,
      applicationId: id,
      responseStatus: body.responseStatus,
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("PATCH /api/submitted-applications/[id] failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
