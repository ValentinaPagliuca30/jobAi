import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  emptyApplicationAnswerValues,
  emptyBasicProfileValues,
  emptyIdentityProfileValues,
  type PersistedProfilePayload,
} from "@/lib/profile";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const profilesTable = "profiles";
const answersTable = "profile_answers";

function toProfileRow(payload: PersistedProfilePayload, clerkUserId: string) {
  return {
    clerk_user_id: clerkUserId,
    full_name: payload.basicInfo.fullName,
    preferred_name: payload.basicInfo.preferredName,
    phone: payload.basicInfo.phone,
    location: payload.basicInfo.location,
    linkedin_url: payload.basicInfo.linkedinUrl,
    github_url: payload.basicInfo.githubUrl,
    portfolio_url: payload.basicInfo.portfolioUrl,
    school: payload.basicInfo.school,
    degree: payload.basicInfo.degree,
    program: payload.basicInfo.program,
    graduation_date: payload.basicInfo.graduationDate,
    work_authorization: payload.basicInfo.workAuthorization,
    sponsorship_answer: payload.basicInfo.sponsorshipAnswer,
    gender: payload.identityInfo.gender,
    race_ethnicity: payload.identityInfo.raceEthnicity,
    veteran_status: payload.identityInfo.veteranStatus,
    disability_status: payload.identityInfo.disabilityStatus,
  };
}

function toProfilePayload(input: {
  profileRow?: Record<string, string | null> | null;
  answerRows?: Array<Record<string, string | null>> | null;
}): PersistedProfilePayload {
  const profileRow = input.profileRow;
  const applicationAnswers = { ...emptyApplicationAnswerValues };

  for (const row of input.answerRows ?? []) {
    const key = row.answer_key;
    if (typeof key === "string" && key in applicationAnswers) {
      applicationAnswers[key as keyof typeof applicationAnswers] = row.content ?? "";
    }
  }

  return {
    basicInfo: {
      ...emptyBasicProfileValues,
      fullName: profileRow?.full_name ?? "",
      preferredName: profileRow?.preferred_name ?? "",
      email: "",
      phone: profileRow?.phone ?? "",
      location: profileRow?.location ?? "",
      linkedinUrl: profileRow?.linkedin_url ?? "",
      githubUrl: profileRow?.github_url ?? "",
      portfolioUrl: profileRow?.portfolio_url ?? "",
      school: profileRow?.school ?? "",
      degree: profileRow?.degree ?? "",
      program: profileRow?.program ?? "",
      graduationDate: profileRow?.graduation_date ?? "",
      workAuthorization: profileRow?.work_authorization ?? "",
      sponsorshipAnswer: profileRow?.sponsorship_answer ?? "",
    },
    identityInfo: {
      ...emptyIdentityProfileValues,
      gender: profileRow?.gender ?? "",
      raceEthnicity: profileRow?.race_ethnicity ?? "",
      veteranStatus: profileRow?.veteran_status ?? "",
      disabilityStatus: profileRow?.disability_status ?? "",
    },
    applicationAnswers,
  };
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You need to sign in to load the profile." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: profileRow, error: profileError } = await supabase
      .from(profilesTable)
      .select(
        "clerk_user_id, full_name, preferred_name, phone, location, linkedin_url, github_url, portfolio_url, school, degree, program, graduation_date, work_authorization, sponsorship_answer, gender, race_ethnicity, veteran_status, disability_status",
      )
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const { data: answerRows, error: answersError } = await supabase
      .from(answersTable)
      .select("answer_key, content")
      .eq("clerk_user_id", userId);

    if (answersError) {
      throw answersError;
    }

    return NextResponse.json({
      profile: toProfilePayload({ profileRow, answerRows }),
    });
  } catch (error) {
    console.error("GET /api/profile failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to load the profile.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You need to sign in to save the profile." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as PersistedProfilePayload;
    const supabase = getSupabaseAdminClient();

    const { data: profileRow, error: profileError } = await supabase
      .from(profilesTable)
      .upsert(toProfileRow(body, userId), { onConflict: "clerk_user_id" })
      .select(
        "clerk_user_id, full_name, preferred_name, phone, location, linkedin_url, github_url, portfolio_url, school, degree, program, graduation_date, work_authorization, sponsorship_answer, gender, race_ethnicity, veteran_status, disability_status",
      )
      .single();

    if (profileError) {
      throw profileError;
    }

    const answerRows = Object.entries(body.applicationAnswers).map(
      ([answerKey, content]) => ({
        clerk_user_id: userId,
        answer_key: answerKey,
        title: answerKey,
        content,
      }),
    );

    const { data: savedAnswers, error: answersError } = await supabase
      .from(answersTable)
      .upsert(answerRows, { onConflict: "clerk_user_id,answer_key" })
      .select("answer_key, content");

    if (answersError) {
      throw answersError;
    }

    return NextResponse.json({
      profile: toProfilePayload({ profileRow, answerRows: savedAnswers }),
    });
  } catch (error) {
    console.error("POST /api/profile failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to save the profile.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
