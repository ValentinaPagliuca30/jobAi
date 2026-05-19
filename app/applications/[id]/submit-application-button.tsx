"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SubmitApplicationButtonProps = {
  applicationId: string;
};

export function SubmitApplicationButton({
  applicationId,
}: SubmitApplicationButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/submitted-applications", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to save the submitted application.",
        );
      }

      setMessage("Application submitted and saved to Succeed.");
      router.push("/succeed");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save the submitted application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit application"}
      </button>
      {message ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{message}</p>
      ) : null}
    </div>
  );
}
