"use client";

import { useEffect, useRef, useState } from "react";
import {
  uploadKinds,
  type ProfileUploadRecord,
  type UploadKind,
} from "@/lib/profile-uploads-shared";

const kindLabels: Record<UploadKind, { title: string; description: string }> = {
  resume: {
    title: "Resume / CV",
    description: "Latest resume PDF. Used to autofill applications.",
  },
  transcript: {
    title: "Transcript",
    description: "Unofficial transcript PDF if requested by employers.",
  },
  cover_letter_sample: {
    title: "Cover letter samples",
    description: "Past cover letters to anchor tone for AI drafting.",
  },
  writing_sample: {
    title: "Writing samples",
    description: "Short pieces that show your voice. Help AI sound like you.",
  },
  portfolio: {
    title: "Portfolio",
    description: "Project sheet, design portfolio, or one-pager PDF.",
  },
};

function formatBytes(bytes: number | null) {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadsSection() {
  const [uploads, setUploads] = useState<ProfileUploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/profile/uploads");
        const payload = (await response.json()) as {
          uploads?: ProfileUploadRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load uploads.");
        }
        if (!cancelled) {
          setUploads(payload.uploads ?? []);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load uploads.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleAddUpload(upload: ProfileUploadRecord) {
    setUploads((current) => [upload, ...current]);
  }

  function handleRemoveUpload(uploadId: string) {
    setUploads((current) => current.filter((upload) => upload.id !== uploadId));
  }

  function handleReplaceUpload(upload: ProfileUploadRecord) {
    setUploads((current) =>
      current.map((existing) => (existing.id === upload.id ? upload : existing)),
    );
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
        Uploads
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Documents to reuse
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
        Files saved here are stored privately on Supabase Storage and reused
        when you start an application.
      </p>

      {loadError ? (
        <p className="mt-4 rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
          {loadError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {uploadKinds.map((kind) => (
          <UploadCard
            key={kind}
            kind={kind}
            title={kindLabels[kind].title}
            description={kindLabels[kind].description}
            uploads={uploads.filter((upload) => upload.kind === kind)}
            isLoading={isLoading}
            onUploaded={handleAddUpload}
            onRemoved={handleRemoveUpload}
            onReplaced={handleReplaceUpload}
          />
        ))}
      </div>
    </section>
  );
}

type UploadCardProps = {
  kind: UploadKind;
  title: string;
  description: string;
  uploads: ProfileUploadRecord[];
  isLoading: boolean;
  onUploaded: (upload: ProfileUploadRecord) => void;
  onRemoved: (uploadId: string) => void;
  onReplaced: (upload: ProfileUploadRecord) => void;
};

function UploadCard({
  kind,
  title,
  description,
  uploads,
  isLoading,
  onUploaded,
  onRemoved,
  onReplaced,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reextractingId, setReextractingId] = useState<string | null>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);

      const response = await fetch("/api/profile/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        upload?: ProfileUploadRecord;
        error?: string;
      };

      if (!response.ok || !payload.upload) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      onUploaded(payload.upload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleDelete(upload: ProfileUploadRecord) {
    if (!confirm(`Remove "${upload.originalFilename}"?`)) return;

    try {
      const response = await fetch(`/api/profile/uploads/${upload.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Delete failed.");
      }

      onRemoved(upload.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function handleReextract(upload: ProfileUploadRecord) {
    setReextractingId(upload.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/profile/uploads/${upload.id}/reextract`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        upload?: ProfileUploadRecord;
        error?: string;
      };
      if (!response.ok || !payload.upload) {
        throw new Error(payload.error ?? "Re-extract failed.");
      }
      onReplaced(payload.upload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-extract failed.");
    } finally {
      setReextractingId(null);
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelected}
          disabled={isUploading || isLoading}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          className="block w-full max-w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {isUploading ? (
          <span className="text-xs font-medium text-slate-500">Uploading…</span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-2xl bg-[var(--peach)] px-3 py-2 text-xs text-[var(--ink)]">
          {error}
        </p>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {uploads.map((upload) => (
            <li
              key={upload.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {upload.originalFilename}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatBytes(upload.sizeBytes)} ·{" "}
                  {new Date(upload.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-1">
                  <ExtractionBadge upload={upload} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {upload.extractionStatus !== "ok" ? (
                  <button
                    type="button"
                    onClick={() => handleReextract(upload)}
                    disabled={reextractingId === upload.id}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reextractingId === upload.id
                      ? "Re-extracting…"
                      : "Re-extract text"}
                  </button>
                ) : null}
                {upload.downloadUrl ? (
                  <a
                    href={upload.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleDelete(upload)}
                  className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-slate-500">No files yet.</p>
      )}
    </div>
  );
}

function ExtractionBadge({ upload }: { upload: ProfileUploadRecord }) {
  if (upload.extractionStatus === "ok") {
    const length = upload.extractedText?.length ?? 0;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
        ✓ Text extracted{length > 0 ? ` · ${length.toLocaleString()} chars` : ""}
      </span>
    );
  }
  if (upload.extractionStatus === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
        ⚠ Could not parse
      </span>
    );
  }
  if (upload.extractionStatus === "unsupported") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        Unsupported file type
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      Pending text extraction
    </span>
  );
}
