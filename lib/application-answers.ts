import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type ApplicationAnswerRecord = {
  id: string;
  applicationId: string;
  clerkUserId: string;
  questionKey: string;
  questionText: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export const calibrationQuestions = [
  {
    key: "calibration_why_company",
    text: "Why does this company matter to you right now?",
    placeholder: "Specific to product, team, or mission.",
  },
  {
    key: "calibration_relevant_experience",
    text: "Which experience from your resume best matches this role?",
    placeholder: "Pick one concrete project or internship.",
  },
  {
    key: "calibration_tone",
    text: "What tone should the draft lean toward?",
    placeholder: "Example: concise, grounded, technical, not overly polished.",
  },
] as const;

export type CalibrationQuestionKey = (typeof calibrationQuestions)[number]["key"];

const tableName = "application_answers";
const baseSelect =
  "id, application_id, clerk_user_id, question_key, question_text, content, created_at, updated_at";

function mapRow(row: Record<string, string | null>): ApplicationAnswerRecord {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    clerkUserId: String(row.clerk_user_id),
    questionKey: String(row.question_key),
    questionText:
      typeof row.question_text === "string" ? row.question_text : null,
    content: String(row.content ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listApplicationAnswers(input: {
  clerkUserId: string;
  applicationId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(baseSelect)
    .eq("clerk_user_id", input.clerkUserId)
    .eq("application_id", input.applicationId);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRow);
}

export async function upsertApplicationAnswers(input: {
  clerkUserId: string;
  applicationId: string;
  answers: ReadonlyArray<{
    questionKey: string;
    questionText?: string | null;
    content: string;
  }>;
}) {
  const supabase = getSupabaseAdminClient();
  const results: ApplicationAnswerRecord[] = [];

  for (const answer of input.answers) {
    const row = {
      application_id: input.applicationId,
      clerk_user_id: input.clerkUserId,
      question_key: answer.questionKey,
      question_text: answer.questionText ?? null,
      content: answer.content,
    };

    const { data: updated, error: updateError } = await supabase
      .from(tableName)
      .update(row)
      .eq("clerk_user_id", input.clerkUserId)
      .eq("application_id", input.applicationId)
      .eq("question_key", answer.questionKey)
      .select(baseSelect)
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (updated) {
      results.push(mapRow(updated));
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from(tableName)
      .insert(row)
      .select(baseSelect)
      .single();

    if (insertError) {
      throw insertError;
    }

    results.push(mapRow(inserted));
  }

  return results;
}
