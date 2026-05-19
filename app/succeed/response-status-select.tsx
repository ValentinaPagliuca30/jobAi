"use client";

import { useState } from "react";
import {
  responseStatusValues,
  type ResponseStatus,
} from "@/lib/submitted-applications";

type ResponseStatusSelectProps = {
  applicationId: string;
  initialStatus: ResponseStatus;
};

const statusLabels: Record<ResponseStatus, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const statusClasses: Record<ResponseStatus, string> = {
  applied: "bg-slate-100 text-slate-700",
  interviewing: "bg-sky-50 text-sky-700",
  offer: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  withdrawn: "bg-slate-50 text-slate-500",
};

export function ResponseStatusSelect({
  applicationId,
  initialStatus,
}: ResponseStatusSelectProps) {
  const [status, setStatus] = useState<ResponseStatus>(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleChange(next: ResponseStatus) {
    const previous = status;
    setStatus(next);
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/submitted-applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ responseStatus: next }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Failed to update status.");
      }
    } catch (error) {
      setStatus(previous);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update status.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="sr-only" htmlFor={`status-${applicationId}`}>
        Response status
      </label>
      <select
        id={`status-${applicationId}`}
        value={status}
        onChange={(event) => handleChange(event.target.value as ResponseStatus)}
        disabled={isSaving}
        className={`appearance-none rounded-full border-0 px-3 py-1 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300 ${statusClasses[status]}`}
      >
        {responseStatusValues.map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      {errorMessage ? (
        <span className="text-[10px] text-rose-700">{errorMessage}</span>
      ) : null}
    </div>
  );
}
