import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const uploadKinds = [
  "resume",
  "transcript",
  "cover_letter_sample",
  "writing_sample",
  "portfolio",
] as const;

export type UploadKind = (typeof uploadKinds)[number];

export type ProfileUploadRecord = {
  id: string;
  clerkUserId: string;
  kind: UploadKind;
  originalFilename: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string | null;
};

const tableName = "profile_uploads";
const bucketName = "user-uploads";
const baseSelect =
  "id, clerk_user_id, kind, original_filename, storage_path, mime_type, size_bytes, created_at, updated_at";

function isUploadKind(value: string): value is UploadKind {
  return (uploadKinds as readonly string[]).includes(value);
}

async function withSignedUrl(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  row: Record<string, unknown>,
): Promise<ProfileUploadRecord> {
  const storagePath = String(row.storage_path);
  const { data: signed } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storagePath, 60 * 60);

  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    kind: String(row.kind) as UploadKind,
    originalFilename: String(row.original_filename),
    storagePath,
    mimeType: typeof row.mime_type === "string" ? row.mime_type : null,
    sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    downloadUrl: signed?.signedUrl ?? null,
  };
}

export async function listProfileUploads(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(baseSelect)
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return Promise.all((data ?? []).map((row) => withSignedUrl(supabase, row)));
}

export async function createProfileUpload(input: {
  clerkUserId: string;
  kind: string;
  file: File;
}) {
  if (!isUploadKind(input.kind)) {
    throw new Error(`Unsupported upload kind: ${input.kind}`);
  }

  const supabase = getSupabaseAdminClient();
  const safeName = input.file.name.replace(/[^\w.-]+/g, "_");
  const storagePath = `${input.clerkUserId}/${input.kind}/${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      clerk_user_id: input.clerkUserId,
      kind: input.kind,
      original_filename: input.file.name,
      storage_path: storagePath,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
    })
    .select(baseSelect)
    .single();

  if (error) {
    await supabase.storage.from(bucketName).remove([storagePath]).catch(() => {});
    throw error;
  }

  return withSignedUrl(supabase, data);
}

export async function deleteProfileUpload(input: {
  clerkUserId: string;
  uploadId: string;
}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from(tableName)
    .select("storage_path")
    .eq("clerk_user_id", input.clerkUserId)
    .eq("id", input.uploadId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Upload not found.");
  }

  const { error: removeError } = await supabase.storage
    .from(bucketName)
    .remove([String(data.storage_path)]);

  if (removeError) {
    throw removeError;
  }

  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .eq("clerk_user_id", input.clerkUserId)
    .eq("id", input.uploadId);

  if (deleteError) {
    throw deleteError;
  }
}
