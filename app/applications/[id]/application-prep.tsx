"use client";

import { useMemo, useState } from "react";
import {
  calibrationQuestions,
  type ApplicationAnswerRecord,
} from "@/lib/application-answers";
import type { ProfileUploadRecord } from "@/lib/profile-uploads";

type ApplicationPrepProps = {
  applicationId: string;
  resumeOptions: ProfileUploadRecord[];
  initialResumeId: string | null;
  initialAnswers: ApplicationAnswerRecord[];
};

function buildInitialMap(answers: ApplicationAnswerRecord[]) {
  const map: Record<string, string> = {};
  for (const question of calibrationQuestions) {
    map[question.key] = "";
  }
  for (const answer of answers) {
    if (answer.questionKey in map) {
      map[answer.questionKey] = answer.content;
    }
  }
  return map;
}

export function ApplicationPrep({
  applicationId,
  resumeOptions,
  initialResumeId,
  initialAnswers,
}: ApplicationPrepProps) {
  const [resumeId, setResumeId] = useState<string | null>(initialResumeId);
  const [answers, setAnswers] = useState<Record<string, string>>(
    buildInitialMap(initialAnswers),
  );
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isSavingAnswers, setIsSavingAnswers] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calibrationFilled = useMemo(
    () =>
      calibrationQuestions.reduce(
        (count, q) => count + ((answers[q.key] ?? "").trim() === "" ? 0 : 1),
        0,
      ),
    [answers],
  );
  const calibrationTotal = calibrationQuestions.length;

  async function handleResumeChange(nextValue: string) {
    const nextResumeId = nextValue === "" ? null : nextValue;
    setResumeId(nextResumeId);
    setIsSavingResume(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/job-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedResumeId: nextResumeId }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update resume.");
      }
      setStatusMessage("Resume choice saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update resume.",
      );
    } finally {
      setIsSavingResume(false);
    }
  }

  async function handleSaveAnswers() {
    setIsSavingAnswers(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(
        `/api/job-applications/${applicationId}/answers`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            answers: calibrationQuestions.map((question) => ({
              questionKey: question.key,
              questionText: question.text,
              content: answers[question.key] ?? "",
            })),
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save answers.");
      }
      setStatusMessage("Calibration answers saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save answers.",
      );
    } finally {
      setIsSavingAnswers(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Resume for this application
        </p>
        {resumeOptions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No resumes uploaded yet. Add one from{" "}
            <a href="/profile" className="font-medium text-sky-700 underline">
              Profile → Uploads
            </a>
            .
          </p>
        ) : resumeOptions.length === 1 ? (
          <p className="mt-3 text-sm text-slate-700">
            Using{" "}
            <span className="font-medium text-slate-900">
              {resumeOptions[0].originalFilename}
            </span>{" "}
            from your profile.
          </p>
        ) : (
          <select
            value={resumeId ?? resumeOptions[0].id}
            onChange={(event) => handleResumeChange(event.target.value)}
            disabled={isSavingResume}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
          >
            {resumeOptions.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.originalFilename}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Calibration answers
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Specific to this posting. Used to tailor the AI draft.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveAnswers}
            disabled={isSavingAnswers}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isSavingAnswers ? "Saving…" : "Save answers"}
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {calibrationQuestions.map((question) => (
            <label
              key={question.key}
              className="block text-sm font-medium text-slate-800"
            >
              {question.text}
              <textarea
                value={answers[question.key] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.key]: event.target.value,
                  }))
                }
                placeholder={question.placeholder}
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
              />
            </label>
          ))}
        </div>

        {calibrationFilled < calibrationTotal ? (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">
              {calibrationFilled}/{calibrationTotal} answered.
            </span>{" "}
            Drafts use these to match your voice — filling all{" "}
            {calibrationTotal} makes a real difference.
          </p>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
