"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to save the submitted application.",
        );
      }

      setMessage("Application submitted and saved to Submitted.");
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
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit application"}
      </Button>
      {message ? (
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
