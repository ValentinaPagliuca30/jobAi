"use client";

import { useState } from "react";
import {
  calibrationQuestions,
  type ApplicationAnswerRecord,
} from "@/lib/application-answers";
import type { ProfileUploadRecord } from "@/lib/profile-uploads";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume for this application</CardTitle>
        </CardHeader>
        <CardContent>
          {resumeOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No resumes uploaded yet. Add one from{" "}
              <a href="/profile" className="underline">
                Profile → Uploads
              </a>
              .
            </p>
          ) : (
            <select
              value={resumeId ?? ""}
              onChange={(event) => handleResumeChange(event.target.value)}
              disabled={isSavingResume}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">— No resume selected —</option>
              {resumeOptions.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.originalFilename}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Calibration answers</CardTitle>
            <CardDescription>
              Specific to this posting. Used to tailor the AI draft.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleSaveAnswers}
            disabled={isSavingAnswers}
          >
            {isSavingAnswers ? "Saving…" : "Save answers"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {calibrationQuestions.map((question) => (
              <div key={question.key} className="flex flex-col gap-2">
                <Label htmlFor={`q-${question.key}`}>{question.text}</Label>
                <Textarea
                  id={`q-${question.key}`}
                  value={answers[question.key] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.key]: event.target.value,
                    }))
                  }
                  placeholder={question.placeholder}
                  className="min-h-28"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {statusMessage ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
