"use client";

import { useState } from "react";
import type { ApplicationAnswerRecord } from "@/lib/application-answers";
import type { ApplicationQuestionRecord } from "@/lib/application-questions-store";
import type { ApplicationAnswerValues } from "@/lib/profile";
import { matchProfileAnswer } from "@/lib/profile-answer-match";

type ApplicationQuestionsProps = {
  applicationId: string;
  initialQuestions: ApplicationQuestionRecord[];
  initialAnswers: ApplicationAnswerRecord[];
  profileAnswers: ApplicationAnswerValues;
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
  const saved = new Map<string, string>();
  for (const answer of savedAnswers) {
    saved.set(answer.questionKey, answer.content);
  }
  const map: Record<string, string> = {};
  for (const question of questions) {
    const key = answerKeyForQuestion(question);
    map[question.id] = saved.get(key) ?? "";
  }
  return map;
}

export function ApplicationQuestions({
  applicationId,
  initialQuestions,
  initialAnswers,
  profileAnswers,
}: ApplicationQuestionsProps) {
  const [questions, setQuestions] =
    useState<ApplicationQuestionRecord[]>(initialQuestions);
  const [values, setValues] = useState<Record<string, string>>(() =>
    buildInitialAnswerMap(initialQuestions, initialAnswers),
  );
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
            answers: questions.map((question) => ({
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

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Application questions
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {questions.length === 0
              ? "No questions scraped yet."
              : `${questions.length} question${questions.length === 1 ? "" : "s"} from the posting.`}
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
          {questions.length > 0 ? (
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
        {questions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            We could not find a question list for this posting. Use{" "}
            <strong>Refresh from ATS</strong> to retry. Currently only
            Greenhouse postings are scraped.
          </p>
        ) : (
          questions.map((question) => {
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

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled
                    title="Generate with AI — coming soon (needs Anthropic key)"
                    className="rounded-full border border-dashed border-slate-300 bg-white/60 px-3 py-1 text-xs text-slate-400"
                  >
                    ✨ Generate (soon)
                  </button>
                </div>
              </div>
            );
          })
        )}

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
