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
const profileSelect =
  "clerk_user_id, full_name, preferred_name, email, phone, location, linkedin_url, github_url, portfolio_url, school, degree, program, graduation_date, work_authorization, sponsorship_answer, gender, race_ethnicity, veteran_status, disability_status";

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts: string[] = [];
    if (typeof candidate.message === "string" && candidate.message.length > 0) {
      parts.push(candidate.message);
    }
    if (typeof candidate.code === "string" && candidate.code.length > 0) {
      parts.push(`(code: ${candidate.code})`);
    }
    if (typeof candidate.details === "string" && candidate.details.length > 0) {
      parts.push(`details: ${candidate.details}`);
    }
    if (typeof candidate.hint === "string" && candidate.hint.length > 0) {
      parts.push(`hint: ${candidate.hint}`);
    }
    if (parts.length > 0) return parts.join(" ");
    try {
      return JSON.stringify(error);
    } catch {
      // fall through
    }
  }
  return "Unknown error";
}

function toProfileRow(payload: PersistedProfilePayload, clerkUserId: string) {
  return {
    clerk_user_id: clerkUserId,
    full_name: payload.basicInfo.fullName,
    preferred_name: payload.basicInfo.preferredName,
    email: payload.basicInfo.email,
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

async function saveProfileRow(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: PersistedProfilePayload,
  clerkUserId: string,
) {
  const profileRow = toProfileRow(payload, clerkUserId);

  const { data: updatedRow, error: updateError } = await supabase
    .from(profilesTable)
    .update(profileRow)
    .eq("clerk_user_id", clerkUserId)
    .select(profileSelect)
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (updatedRow) {
    return updatedRow;
  }

  const { data: insertedRow, error: insertError } = await supabase
    .from(profilesTable)
    .insert(profileRow)
    .select(profileSelect)
    .single();

  if (insertError) {
    throw insertError;
  }

  return insertedRow;
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
      email: profileRow?.email ?? "",
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
      .select(profileSelect)
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
        { error: "You need to sign in to save the profile." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as PersistedProfilePayload;
    const supabase = getSupabaseAdminClient();

    const profileRow = await saveProfileRow(supabase, body, userId);

    const savedAnswers = await Promise.all(
      Object.entries(body.applicationAnswers).map(async ([answerKey, content]) => {
        const answerRow = {
          clerk_user_id: userId,
          answer_key: answerKey,
          title: answerKey,
          content,
        };

        const { data: updatedAnswer, error: updateError } = await supabase
          .from(answersTable)
          .update(answerRow)
          .eq("clerk_user_id", userId)
          .eq("answer_key", answerKey)
          .select("answer_key, content")
          .maybeSingle();

        if (updateError) {
          throw updateError;
        }

        if (updatedAnswer) {
          return updatedAnswer;
        }

        const { data: insertedAnswer, error: insertError } = await supabase
          .from(answersTable)
          .insert(answerRow)
          .select("answer_key, content")
          .single();

        if (insertError) {
          throw insertError;
        }

        return insertedAnswer;
      }),
    );

    return NextResponse.json({
      profile: toProfilePayload({ profileRow, answerRows: savedAnswers }),
    });
  } catch (error) {
    console.error("POST /api/profile failed", error);
    return NextResponse.json(
      { error: describeError(error) },
      { status: 500 },
    );
  }
}
