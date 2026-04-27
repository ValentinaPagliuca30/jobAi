import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type JobApplicationRecord = {
  id: string;
  clerkUserId: string;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  atsType: string | null;
  jobDescription: string;
  location: string | null;
  status: string;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const tableName = "job_applications";

function mapJobApplicationRecord(
  row: Record<string, string | null>,
): JobApplicationRecord {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    companyName: String(row.company_name ?? ""),
    jobTitle: String(row.job_title ?? ""),
    jobUrl: String(row.job_url),
    atsType: typeof row.ats_type === "string" ? row.ats_type : null,
    jobDescription: String(row.job_description ?? ""),
    location: typeof row.location === "string" ? row.location : null,
    status: String(row.status ?? "intake_complete"),
    appliedAt: typeof row.applied_at === "string" ? row.applied_at : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const baseSelect =
  "id, clerk_user_id, company_name, job_title, job_url, ats_type, job_description, location, status, applied_at, created_at, updated_at";

export async function createJobApplication(input: {
  clerkUserId: string;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  atsType?: string | null;
  jobDescription: string;
  location?: string | null;
  status?: string;
}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      clerk_user_id: input.clerkUserId,
      company_name: input.companyName,
      job_title: input.jobTitle,
      job_url: input.jobUrl,
      ats_type: input.atsType ?? null,
      job_description: input.jobDescription,
      location: input.location ?? null,
      status: input.status ?? "intake_complete",
    })
    .select(baseSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapJobApplicationRecord(data);
}

export async function listJobApplications(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(baseSelect)
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapJobApplicationRecord);
}

export async function listDraftJobApplications(clerkUserId: string) {
  const applications = await listJobApplications(clerkUserId);

  return applications.filter((application) => application.status !== "submitted");
}

export async function getJobApplicationById(
  clerkUserId: string,
  applicationId: string,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(baseSelect)
    .eq("clerk_user_id", clerkUserId)
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapJobApplicationRecord(data) : null;
}

export async function markJobApplicationSubmitted(
  clerkUserId: string,
  applicationId: string,
) {
  const supabase = getSupabaseAdminClient();
  const appliedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from(tableName)
    .update({
      status: "submitted",
      applied_at: appliedAt,
    })
    .eq("clerk_user_id", clerkUserId)
    .eq("id", applicationId)
    .select(baseSelect)
    .single();

  if (error) {
    throw error;
  }

  return mapJobApplicationRecord(data);
}

export async function deleteJobApplication(
  clerkUserId: string,
  applicationId: string,
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("clerk_user_id", clerkUserId)
    .eq("id", applicationId);

  if (error) {
    throw error;
  }
}
