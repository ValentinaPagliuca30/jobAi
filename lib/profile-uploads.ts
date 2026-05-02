import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  uploadKinds,
  type ExtractionStatus,
  type ProfileUploadRecord,
  type UploadKind,
} from "@/lib/profile-uploads-shared";
import { extractTextFromBuffer } from "@/lib/text-extraction";

export {
  uploadKinds,
  type ExtractionStatus,
  type ProfileUploadRecord,
  type UploadKind,
} from "@/lib/profile-uploads-shared";

const tableName = "profile_uploads";
const bucketName = "user-uploads";
const baseSelect =
  "id, clerk_user_id, kind, original_filename, storage_path, mime_type, size_bytes, created_at, updated_at, extracted_text, extraction_status, extracted_at";

function isUploadKind(value: string): value is UploadKind {
  return (uploadKinds as readonly string[]).includes(value);
}

function normalizeStatus(value: unknown): ExtractionStatus {
  if (value === "ok" || value === "failed" || value === "unsupported") {
    return value;
  }
  return "pending";
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
    extractedText:
      typeof row.extracted_text === "string" ? row.extracted_text : null,
    extractionStatus: normalizeStatus(row.extraction_status),
    extractedAt:
      typeof row.extracted_at === "string" ? row.extracted_at : null,
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

  const extraction = await extractTextFromBuffer(
    buffer,
    input.file.type || null,
    input.file.name,
  );
  const extractedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      clerk_user_id: input.clerkUserId,
      kind: input.kind,
      original_filename: input.file.name,
      storage_path: storagePath,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
      extracted_text: extraction.status === "ok" ? extraction.text : null,
      extraction_status: extraction.status,
      extracted_at: extractedAt,
    })
    .select(baseSelect)
    .single();

  if (error) {
    await supabase.storage.from(bucketName).remove([storagePath]).catch(() => {});
    throw error;
  }

  if (extraction.status === "failed") {
    console.warn(
      `Extraction failed for upload ${storagePath}: ${extraction.reason}`,
    );
  }

  return withSignedUrl(supabase, data);
}

export async function reextractProfileUpload(input: {
  clerkUserId: string;
  uploadId: string;
}): Promise<ProfileUploadRecord> {
  const supabase = getSupabaseAdminClient();

  const { data: row, error: rowError } = await supabase
    .from(tableName)
    .select("storage_path, mime_type, original_filename")
    .eq("clerk_user_id", input.clerkUserId)
    .eq("id", input.uploadId)
    .maybeSingle();

  if (rowError) {
    throw rowError;
  }
  if (!row) {
    throw new Error("Upload not found.");
  }

  const storagePath = String(row.storage_path);
  const { data: download, error: downloadError } = await supabase.storage
    .from(bucketName)
    .download(storagePath);

  if (downloadError || !download) {
    throw downloadError ?? new Error("Could not download stored file.");
  }

  const buffer = Buffer.from(await download.arrayBuffer());
  const mimeType =
    typeof row.mime_type === "string" ? row.mime_type : download.type || null;
  const filename =
    typeof row.original_filename === "string" ? row.original_filename : undefined;

  const extraction = await extractTextFromBuffer(buffer, mimeType, filename);

  const { data: updated, error: updateError } = await supabase
    .from(tableName)
    .update({
      extracted_text: extraction.status === "ok" ? extraction.text : null,
      extraction_status: extraction.status,
      extracted_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", input.clerkUserId)
    .eq("id", input.uploadId)
    .select(baseSelect)
    .single();

  if (updateError) {
    throw updateError;
  }

  return withSignedUrl(supabase, updated);
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
