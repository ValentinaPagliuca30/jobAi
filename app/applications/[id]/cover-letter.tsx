"use client";

import { useMemo, useState } from "react";

type CoverLetterProps = {
  applicationId: string;
  initialDraft: string | null;
  initialEdited: string | null;
  initialGeneratedAt: string | null;
  canGenerate: boolean;
  generateBlockedReason: string | null;
};

export function CoverLetter({
  applicationId,
  initialDraft,
  initialEdited,
  initialGeneratedAt,
  canGenerate,
  generateBlockedReason,
}: CoverLetterProps) {
  const [draft, setDraft] = useState<string | null>(initialDraft);
  const [edited, setEdited] = useState<string | null>(initialEdited);
  const [generatedAt, setGeneratedAt] = useState<string | null>(
    initialGeneratedAt,
  );
  const [textValue, setTextValue] = useState<string>(
    initialEdited ?? initialDraft ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wordCount = useMemo(
    () => textValue.trim().split(/\s+/).filter(Boolean).length,
    [textValue],
  );

  const isEdited =
    draft !== null && textValue !== draft && textValue.trim() !== "";
  const hasDraft = draft !== null && draft.trim() !== "";

  async function handleGenerate() {
    setIsGenerating(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/generate/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const payload = (await response.json()) as {
        draft?: string;
        generatedAt?: string | null;
        error?: string;
      };
      if (!response.ok || typeof payload.draft !== "string") {
        throw new Error(payload.error ?? "Generation failed.");
      }
      setDraft(payload.draft);
      setEdited(null);
      setTextValue(payload.draft);
      setGeneratedAt(payload.generatedAt ?? null);
      setStatusMessage("Draft generated. Edit it freely below.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await fetch(
        `/api/job-applications/${applicationId}/cover-letter`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ edited: textValue }),
        },
      );
      const payload = (await response.json()) as {
        coverLetterEdited?: string | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Save failed.");
      }
      setEdited(payload.coverLetterEdited ?? null);
      setStatusMessage("Cover letter saved.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetToDraft() {
    if (draft === null) return;
    setTextValue(draft);
    setStatusMessage("Reverted to AI draft (not yet saved).");
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Cover letter
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Generate a starting draft, then edit it in your voice.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate}
            title={!canGenerate ? generateBlockedReason ?? undefined : undefined}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating
              ? "Generating…"
              : hasDraft
                ? "✨ Regenerate"
                : "✨ Generate cover letter"}
          </button>
          {hasDraft ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save edits"}
            </button>
          ) : null}
        </div>
      </div>

      {hasDraft ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {isEdited ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
              Edited
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              AI draft
            </span>
          )}
          {generatedAt ? (
            <span className="text-slate-500">
              Last generated {new Date(generatedAt).toLocaleString()}
            </span>
          ) : null}
          {edited !== null ? (
            <span className="text-slate-500">· saved</span>
          ) : null}
          {isEdited ? (
            <button
              type="button"
              onClick={handleResetToDraft}
              className="ml-auto text-xs font-medium text-sky-700 underline"
            >
              Reset to AI draft
            </button>
          ) : null}
        </div>
      ) : null}

      <textarea
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
        placeholder={
          hasDraft
            ? "Edit the draft here…"
            : "Click ‘Generate cover letter’ to create a first draft."
        }
        className="mt-4 min-h-[280px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 focus:border-sky-400 focus:outline-none"
      />

      <p className="mt-2 text-xs text-slate-500">
        {wordCount} word{wordCount === 1 ? "" : "s"}
      </p>

      {!canGenerate && generateBlockedReason ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {generateBlockedReason}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-3 rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
