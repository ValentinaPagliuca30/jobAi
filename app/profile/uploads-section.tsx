"use client";

import { useEffect, useRef, useState } from "react";
import {
  uploadKinds,
  type ProfileUploadRecord,
  type UploadKind,
} from "@/lib/profile-uploads";
import { Button, buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Files saved here are stored privately on Supabase Storage and reused
          when you start an application.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loadError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
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
            />
          ))}
        </div>
      </CardContent>
    </Card>
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
};

function UploadCard({
  kind,
  title,
  description,
  uploads,
  isLoading,
  onUploaded,
  onRemoved,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
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

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelected}
          disabled={isUploading || isLoading}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          className="block w-full max-w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {isUploading ? (
          <span className="text-xs text-muted-foreground">Uploading…</span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {uploads.map((upload) => (
            <li
              key={upload.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {upload.originalFilename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(upload.sizeBytes)} ·{" "}
                  {new Date(upload.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {upload.downloadUrl ? (
                  <a
                    href={upload.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses("outline", "sm")}
                  >
                    View
                  </a>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(upload)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No files yet.</p>
      )}
    </div>
  );
}
