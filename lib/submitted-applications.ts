import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const responseStatusValues = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ResponseStatus = (typeof responseStatusValues)[number];

export function isResponseStatus(value: unknown): value is ResponseStatus {
  return (
    typeof value === "string" &&
    (responseStatusValues as readonly string[]).includes(value)
  );
}

export type SubmittedApplicationRecord = {
  id: string;
  clerkUserId: string;
  sourceApplicationId: string | null;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  location: string | null;
  atsType: string | null;
  appliedAt: string;
  createdAt: string;
  responseStatus: ResponseStatus;
  respondedAt: string | null;
};

const tableName = "submitted_applications";
const baseSelect =
  "id, clerk_user_id, source_application_id, company_name, job_title, job_url, location, ats_type, applied_at, created_at, response_status, responded_at";

export async function createSubmittedApplication(input: {
  clerkUserId: string;
  sourceApplicationId?: string | null;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  location?: string | null;
  atsType?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const appliedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      clerk_user_id: input.clerkUserId,
      source_application_id: input.sourceApplicationId ?? null,
      company_name: input.companyName,
      job_title: input.jobTitle,
      job_url: input.jobUrl,
      location: input.location ?? null,
      ats_type: input.atsType ?? null,
      applied_at: appliedAt,
    })
    .select(baseSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapSubmittedApplicationRecord(data);
}

export async function listSubmittedApplications(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from(tableName)
    .select(baseSelect)
    .eq("clerk_user_id", clerkUserId)
    .order("applied_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSubmittedApplicationRecord);
}

function mapSubmittedApplicationRecord(
  row: Record<string, string | null>,
): SubmittedApplicationRecord {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    sourceApplicationId:
      typeof row.source_application_id === "string"
        ? row.source_application_id
        : null,
    companyName: String(row.company_name),
    jobTitle: String(row.job_title),
    jobUrl: String(row.job_url),
    location: typeof row.location === "string" ? row.location : null,
    atsType: typeof row.ats_type === "string" ? row.ats_type : null,
    appliedAt: String(row.applied_at),
    createdAt: String(row.created_at),
    responseStatus: isResponseStatus(row.response_status)
      ? row.response_status
      : "applied",
    respondedAt:
      typeof row.responded_at === "string" ? row.responded_at : null,
  };
}

export async function updateSubmittedApplicationStatus(input: {
  clerkUserId: string;
  applicationId: string;
  responseStatus: ResponseStatus;
}) {
  const supabase = getSupabaseAdminClient();
  const respondedAt =
    input.responseStatus === "applied" ? null : new Date().toISOString();

  const { data, error } = await supabase
    .from(tableName)
    .update({
      response_status: input.responseStatus,
      responded_at: respondedAt,
    })
    .eq("clerk_user_id", input.clerkUserId)
    .eq("id", input.applicationId)
    .select(baseSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapSubmittedApplicationRecord(data);
}
