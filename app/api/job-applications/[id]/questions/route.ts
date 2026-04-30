import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listApplicationQuestions } from "@/lib/application-questions-store";
import { describeError } from "@/lib/error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to load questions." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const questions = await listApplicationQuestions({
      clerkUserId: userId,
      applicationId: id,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
