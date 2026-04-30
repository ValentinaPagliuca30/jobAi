import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  listApplicationAnswers,
  upsertApplicationAnswers,
} from "@/lib/application-answers";
import { describeError } from "@/lib/error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to load answers." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const answers = await listApplicationAnswers({
      clerkUserId: userId,
      applicationId: id,
    });

    return NextResponse.json({ answers });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to save answers." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      answers?: Array<{
        questionKey: string;
        questionText?: string | null;
        content: string;
      }>;
    };

    if (!Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: "Missing 'answers' array." },
        { status: 400 },
      );
    }

    const answers = await upsertApplicationAnswers({
      clerkUserId: userId,
      applicationId: id,
      answers: body.answers,
    });

    return NextResponse.json({ answers });
  } catch (error) {
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
