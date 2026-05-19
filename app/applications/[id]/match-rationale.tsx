"use client";

import { useEffect, useRef, useState } from "react";

type MatchRationaleProps = {
  applicationId: string;
  initialDraft: string | null;
  initialGeneratedAt: string | null;
  canGenerate: boolean;
  generateBlockedReason: string | null;
};

export function MatchRationale({
  applicationId,
  initialDraft,
  initialGeneratedAt,
  canGenerate,
  generateBlockedReason,
}: MatchRationaleProps) {
  const [draft, setDraft] = useState<string | null>(initialDraft);
  const [generatedAt, setGeneratedAt] = useState<string | null>(
    initialGeneratedAt,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate on first load if the rationale is empty AND the
  // generation prerequisites are met. This is the "wow" moment of the
  // page — the box fills itself within 2 seconds of opening the draft.
  const hasAutoTriggered = useRef(false);
  useEffect(() => {
    if (hasAutoTriggered.current) return;
    if (draft !== null) return;
    if (!canGenerate) return;
    hasAutoTriggered.current = true;
    void handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGenerate]);

  async function handleGenerate() {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/generate/rationale", {
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
      setGeneratedAt(payload.generatedAt ?? null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-[2rem] border-l-4 border-l-sky-500 border-y border-r border-y-slate-200 border-r-slate-200 bg-sky-50/40 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Why this match?
          </p>
          <p className="mt-1 text-sm text-slate-600">
            AI-generated rationale based on your profile and this posting.
          </p>
        </div>
        {draft !== null && canGenerate ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Regenerating…" : "↻ Regenerate"}
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        {!canGenerate ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {generateBlockedReason ??
              "Fill in your profile before JobPilot can explain the match."}
          </p>
        ) : isGenerating && draft === null ? (
          <p className="text-sm italic text-slate-500">
            Reading your resume + this posting…
          </p>
        ) : draft !== null ? (
          <>
            <p className="whitespace-pre-wrap text-base leading-7 text-slate-900">
              {draft}
            </p>
            {generatedAt ? (
              <p className="mt-3 text-xs text-slate-500">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generating…" : "✨ Explain the match"}
          </button>
        )}

        {errorMessage ? (
          <p className="mt-3 rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
