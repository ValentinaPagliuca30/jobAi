import { getSupabaseAdminClient } from "@/lib/supabase-admin";

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
};

const tableName = "submitted_applications";

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
    .select(
      "id, clerk_user_id, source_application_id, company_name, job_title, job_url, location, ats_type, applied_at, created_at",
    )
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
    .select(
      "id, clerk_user_id, source_application_id, company_name, job_title, job_url, location, ats_type, applied_at, created_at",
    )
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
  };
}
