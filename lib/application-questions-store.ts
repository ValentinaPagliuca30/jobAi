import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ScrapedQuestion } from "@/lib/job-questions";

export type ApplicationQuestionRecord = {
  id: string;
  applicationId: string;
  clerkUserId: string;
  sourceQuestionId: string | null;
  position: number;
  questionText: string;
  questionType: string | null;
  required: boolean;
  options: ReadonlyArray<{ label: string; value: string | number }> | null;
  createdAt: string;
  updatedAt: string;
};

const tableName = "application_questions";
const baseSelect =
  "id, application_id, clerk_user_id, source_question_id, position, question_text, question_type, required, options, created_at, updated_at";

function mapRow(row: Record<string, unknown>): ApplicationQuestionRecord {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    clerkUserId: String(row.clerk_user_id),
    sourceQuestionId:
      typeof row.source_question_id === "string"
        ? row.source_question_id
        : null,
    position: Number(row.position ?? 0),
    questionText: String(row.question_text ?? ""),
    questionType:
      typeof row.question_type === "string" ? row.question_type : null,
    required: Boolean(row.required),
    options: Array.isArray(row.options)
      ? (row.options as Array<{ label: string; value: string | number }>)
      : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listApplicationQuestions(input: {
  clerkUserId: string;
  applicationId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(baseSelect)
    .eq("clerk_user_id", input.clerkUserId)
    .eq("application_id", input.applicationId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function replaceApplicationQuestions(input: {
  clerkUserId: string;
  applicationId: string;
  questions: ReadonlyArray<ScrapedQuestion>;
}) {
  const supabase = getSupabaseAdminClient();

  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq("clerk_user_id", input.clerkUserId)
    .eq("application_id", input.applicationId);

  if (deleteError) throw deleteError;

  if (input.questions.length === 0) return [];

  const rows = input.questions.map((question) => ({
    application_id: input.applicationId,
    clerk_user_id: input.clerkUserId,
    source_question_id: question.sourceQuestionId,
    position: question.position,
    question_text: question.questionText,
    question_type: question.questionType,
    required: question.required,
    options: question.options ?? null,
    ats_metadata: question.atsMetadata ?? null,
  }));

  const { data, error } = await supabase
    .from(tableName)
    .insert(rows)
    .select(baseSelect);

  if (error) throw error;
  return (data ?? []).map(mapRow);
}
