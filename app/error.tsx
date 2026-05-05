"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-16 sm:px-8">
        <section className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--danger)]">
            Something went wrong
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            We hit an unexpected error.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {error.message || "Unknown error. Try again, or head back home."}
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              digest: {error.digest}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-black/5"
            >
              Back home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
