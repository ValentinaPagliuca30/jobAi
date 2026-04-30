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

export async function loadProfileForUser(
  clerkUserId: string,
): Promise<PersistedProfilePayload> {
  const supabase = getSupabaseAdminClient();

  const [{ data: profileRow }, { data: answerRows }] = await Promise.all([
    supabase
      .from(profilesTable)
      .select(profileSelect)
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle(),
    supabase
      .from(answersTable)
      .select("answer_key, content")
      .eq("clerk_user_id", clerkUserId),
  ]);

  const applicationAnswers = { ...emptyApplicationAnswerValues };
  for (const row of answerRows ?? []) {
    const key = row.answer_key as string | null;
    if (typeof key === "string" && key in applicationAnswers) {
      applicationAnswers[key as keyof typeof applicationAnswers] =
        (row.content as string | null) ?? "";
    }
  }

  return {
    basicInfo: {
      ...emptyBasicProfileValues,
      fullName: (profileRow?.full_name as string | null) ?? "",
      preferredName: (profileRow?.preferred_name as string | null) ?? "",
      email: (profileRow?.email as string | null) ?? "",
      phone: (profileRow?.phone as string | null) ?? "",
      location: (profileRow?.location as string | null) ?? "",
      linkedinUrl: (profileRow?.linkedin_url as string | null) ?? "",
      githubUrl: (profileRow?.github_url as string | null) ?? "",
      portfolioUrl: (profileRow?.portfolio_url as string | null) ?? "",
      school: (profileRow?.school as string | null) ?? "",
      degree: (profileRow?.degree as string | null) ?? "",
      program: (profileRow?.program as string | null) ?? "",
      graduationDate: (profileRow?.graduation_date as string | null) ?? "",
      workAuthorization:
        (profileRow?.work_authorization as string | null) ?? "",
      sponsorshipAnswer:
        (profileRow?.sponsorship_answer as string | null) ?? "",
    },
    identityInfo: {
      ...emptyIdentityProfileValues,
      gender: (profileRow?.gender as string | null) ?? "",
      raceEthnicity: (profileRow?.race_ethnicity as string | null) ?? "",
      veteranStatus: (profileRow?.veteran_status as string | null) ?? "",
      disabilityStatus: (profileRow?.disability_status as string | null) ?? "",
    },
    applicationAnswers,
  };
}
