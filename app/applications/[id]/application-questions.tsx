"use client";

import { useMemo, useState } from "react";
import type { ApplicationAnswerRecord } from "@/lib/application-answers";
import type { ApplicationQuestionRecord } from "@/lib/application-questions-store";
import type { ApplicationAnswerValues } from "@/lib/profile";
import { matchProfileAnswer } from "@/lib/profile-answer-match";

// Questions whose label maps to a standard profile field (Basic info or
// Self-identification) already saved in /profile. Hiding them from the editor
// reduces noise — the worker autofills text inputs, and for demographic Selects
// the user picks on the Greenhouse page directly (they're option-based, not
// AI-draftable).
const standardFieldPatterns: ReadonlyArray<RegExp> = [
  /\bfirst\s*name\b/,
  /\blast\s*name\b/,
  /\bfull\s*name\b/,
  /\bpreferred\s*(first\s*)?name\b/,
  /\bemail\b/,
  /\bphone\b/,
  /\blinkedin\b/,
  /\bgithub\b/,
  /\bportfolio\b/,
  /\bwebsite\b/,
  /\blocation\s*\(?city\)?\b/,
  /\bschool\b/,
  /\buniversity\b/,
  /\bresume\b/,
  /\bcv\b/,
  /\bcover\s*letter\b/,
  // Self-identification demographics — saved in profile identityInfo.
  // No trailing \b because Greenhouse sometimes uses PascalCase compound
  // labels like "DisabilityStatus" / "VeteranStatus" which lowercase to one
  // word with no internal boundary.
  /\bgender/,
  /\brace/,
  /\bethnicity/,
  /\bhispanic/,
  /\blatino/,
  /\bveteran/,
  /\bdisability/,
  // Other Basic info fields
  /\bgpa\b/,
  /\bgrade\s*point\s*average\b/,
  /\bgraduat(?:e|ion)/,
];

function isStandardField(question: ApplicationQuestionRecord): boolean {
  if (question.questionType?.includes("file")) return true;
  const label = question.questionText.toLowerCase();
  return standardFieldPatterns.some((re) => re.test(label));
}

type ApplicationQuestionsProps = {
  applicationId: string;
  initialQuestions: ApplicationQuestionRecord[];
  initialAnswers: ApplicationAnswerRecord[];
  profileAnswers: ApplicationAnswerValues;
  canGenerate: boolean;
  generateBlockedReason: string | null;
};

function answerKeyForQuestion(question: ApplicationQuestionRecord) {
  return question.sourceQuestionId
    ? `posting_${question.sourceQuestionId}`
    : `posting_${question.id}`;
}

function buildInitialAnswerMap(
  questions: ApplicationQuestionRecord[],
  savedAnswers: ApplicationAnswerRecord[],
) {
  const saved = new Map<string, ApplicationAnswerRecord>();
  for (const answer of savedAnswers) {
    saved.set(answer.questionKey, answer);
  }
  const values: Record<string, string> = {};
  const drafts: Record<string, string | null> = {};
  for (const question of questions) {
    const key = answerKeyForQuestion(question);
    const record = saved.get(key);
    values[question.id] = record?.content ?? record?.answerDraft ?? "";
    drafts[question.id] = record?.answerDraft ?? null;
  }
  return { values, drafts };
}

export function ApplicationQuestions({
  applicationId,
  initialQuestions,
  initialAnswers,
  profileAnswers,
  canGenerate,
  generateBlockedReason,
}: ApplicationQuestionsProps) {
  const [questions, setQuestions] =
    useState<ApplicationQuestionRecord[]>(initialQuestions);
  const initialMap = buildInitialAnswerMap(initialQuestions, initialAnswers);
  const [values, setValues] = useState<Record<string, string>>(
    initialMap.values,
  );
  const [drafts, setDrafts] = useState<Record<string, string | null>>(
    initialMap.drafts,
  );
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(
        `/api/job-applications/${applicationId}/questions/refresh`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        questions?: ApplicationQuestionRecord[];
        error?: string;
      };
      if (!response.ok || !payload.questions) {
        throw new Error(payload.error ?? "Refresh failed.");
      }

      setQuestions(payload.questions);
      setValues((current) => {
        const next: Record<string, string> = {};
        for (const question of payload.questions ?? []) {
          next[question.id] = current[question.id] ?? "";
        }
        return next;
      });
      setDrafts((current) => {
        const next: Record<string, string | null> = {};
        for (const question of payload.questions ?? []) {
          next[question.id] = current[question.id] ?? null;
        }
        return next;
      });
      setStatusMessage(`Loaded ${payload.questions.length} questions.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Refresh failed.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(
        `/api/job-applications/${applicationId}/answers`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            answers: questions
              .filter((q) => !isStandardField(q))
              .map((question) => ({
                questionKey: answerKeyForQuestion(question),
                questionText: question.questionText,
                content: values[question.id] ?? "",
              })),
          }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save answers.");
      }
      setStatusMessage("Answers saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save answers.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function applySuggestion(questionId: string, suggestion: string) {
    setValues((current) => ({ ...current, [questionId]: suggestion }));
  }

  async function handleGenerate(question: ApplicationQuestionRecord) {
    setGeneratingId(question.id);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/generate/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId,
          questionKey: answerKeyForQuestion(question),
          questionText: question.questionText,
        }),
      });
      const payload = (await response.json()) as {
        draft?: string;
        error?: string;
      };
      if (!response.ok || typeof payload.draft !== "string") {
        throw new Error(payload.error ?? "Generation failed.");
      }
      setDrafts((current) => ({ ...current, [question.id]: payload.draft! }));
      setValues((current) => ({ ...current, [question.id]: payload.draft! }));
      setStatusMessage("Draft generated. Edit it freely, then Save answers.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Generation failed.",
      );
    } finally {
      setGeneratingId(null);
    }
  }

  function handleResetToDraft(questionId: string) {
    const draft = drafts[questionId];
    if (draft === null || draft === undefined) return;
    setValues((current) => ({ ...current, [questionId]: draft }));
  }

  const customQuestions = useMemo(
    () => questions.filter((q) => !isStandardField(q)),
    [questions],
  );
  const standardCount = questions.length - customQuestions.length;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Application questions
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {customQuestions.length === 0
              ? questions.length === 0
                ? "No questions scraped yet."
                : "No custom questions — the worker autofills everything from your profile."
              : `${customQuestions.length} posting-specific question${customQuestions.length === 1 ? "" : "s"}.`}
            {standardCount > 0 && customQuestions.length > 0 ? (
              <span className="block text-xs text-slate-500">
                {standardCount} standard field
                {standardCount === 1 ? "" : "s"} (name, email, phone, links…)
                hidden — the worker autofills them.
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing…" : "Refresh from ATS"}
          </button>
          {customQuestions.length > 0 ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save answers"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {customQuestions.length === 0 ? (
          questions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              We could not find a question list for this posting. Use{" "}
              <strong>Refresh from ATS</strong> to retry. Currently only
              Greenhouse postings are scraped.
            </p>
          ) : null
        ) : (
          customQuestions.map((question) => {
            const fieldValue = values[question.id] ?? "";
            const suggestion = matchProfileAnswer(
              question.questionText,
              profileAnswers,
            );
            const usingSuggestion =
              suggestion && fieldValue.trim() === suggestion.suggestion.trim();

            return (
              <div
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <label
                  htmlFor={`question-${question.id}`}
                  className="block text-sm font-medium text-slate-800"
                >
                  {question.questionText}
                  {question.required ? (
                    <span className="ml-1 text-rose-600">*</span>
                  ) : null}
                </label>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {question.questionType ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ring-1 ring-slate-200">
                      {question.questionType}
                    </span>
                  ) : null}
                  {suggestion && !usingSuggestion ? (
                    <button
                      type="button"
                      onClick={() =>
                        applySuggestion(question.id, suggestion.suggestion)
                      }
                      className="text-xs font-medium text-sky-700 underline"
                    >
                      Use saved “{suggestion.block}”
                    </button>
                  ) : null}
                  {usingSuggestion ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      From profile
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <QuestionInput
                    question={question}
                    value={fieldValue}
                    onChange={(next) =>
                      setValues((current) => ({
                        ...current,
                        [question.id]: next,
                      }))
                    }
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerate(question)}
                    disabled={generatingId === question.id || !canGenerate}
                    title={
                      !canGenerate
                        ? generateBlockedReason ?? undefined
                        : undefined
                    }
                    className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingId === question.id
                      ? "Generating…"
                      : drafts[question.id]
                        ? "✨ Regenerate"
                        : "✨ Generate draft"}
                  </button>
                  {drafts[question.id] !== null &&
                  drafts[question.id] !== undefined ? (
                    fieldValue === drafts[question.id] ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                        AI draft
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                          Edited
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetToDraft(question.id)}
                          className="text-xs font-medium text-sky-700 underline"
                        >
                          Reset to AI draft
                        </button>
                      </>
                    )
                  ) : null}
                </div>
              </div>
            );
          })
        )}

        {!canGenerate && generateBlockedReason && questions.length > 0 ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {generateBlockedReason}
          </p>
        ) : null}

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
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: ApplicationQuestionRecord;
  value: string;
  onChange: (next: string) => void;
}) {
  const isSelect =
    question.questionType?.includes("select") &&
    Array.isArray(question.options) &&
    question.options.length > 0;
  const isLongForm =
    question.questionType?.includes("textarea") ||
    /describe|tell us|why|explain|what|how|story/i.test(question.questionText);

  if (isSelect && question.options) {
    return (
      <select
        id={`question-${question.id}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
      >
        <option value="">— Select —</option>
        {question.options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (isLongForm) {
    return (
      <textarea
        id={`question-${question.id}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your answer…"
        className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
      />
    );
  }

  return (
    <input
      id={`question-${question.id}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type your answer…"
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
    />
  );
}
