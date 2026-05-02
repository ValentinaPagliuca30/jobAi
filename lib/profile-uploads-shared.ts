// Client-safe types and constants for profile uploads.
// The server-only logic (Supabase calls, text extraction) lives in
// `lib/profile-uploads.ts`. Keeping these split prevents client bundles from
// pulling in pdf-parse / mammoth.

export const uploadKinds = [
  "resume",
  "transcript",
  "cover_letter_sample",
  "writing_sample",
  "portfolio",
] as const;

export type UploadKind = (typeof uploadKinds)[number];

export type ExtractionStatus = "pending" | "ok" | "failed" | "unsupported";

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
  extractedText: string | null;
  extractionStatus: ExtractionStatus;
  extractedAt: string | null;
};
