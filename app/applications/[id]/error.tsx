"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ApplicationDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application detail page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
            Something broke
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            We couldn’t load this application.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {error.message || "Unknown error."}
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-slate-400">digest: {error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try again
            </button>
            <Link
              href="/drafts"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to drafts
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
