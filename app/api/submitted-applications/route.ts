import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getJobApplicationById, markJobApplicationSubmitted } from "@/lib/job-applications";
import { createSubmittedApplication } from "@/lib/submitted-applications";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You need to sign in before submitting an application." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { applicationId?: string };
    const applicationId = body.applicationId?.trim();

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required." },
        { status: 400 },
      );
    }

    const application = await getJobApplicationById(userId, applicationId);

    if (!application) {
      return NextResponse.json(
        { error: "No application found for this ID." },
        { status: 404 },
      );
    }

    const submitted = await createSubmittedApplication({
      clerkUserId: userId,
      sourceApplicationId: application.id,
      companyName: application.companyName,
      jobTitle: application.jobTitle,
      jobUrl: application.jobUrl,
      location: application.location,
      atsType: application.atsType,
    });

    await markJobApplicationSubmitted(userId, application.id);

    return NextResponse.json({ submitted });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save the submitted application.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
