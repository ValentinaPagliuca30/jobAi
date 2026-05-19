"use client";

import { useState } from "react";

type AutofillInstructionsProps = {
  applicationId: string;
  clerkUserId: string;
};

export function AutofillInstructions({
  applicationId,
  clerkUserId,
}: AutofillInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const command = `npm run autofill -- --application ${applicationId} --user ${clerkUserId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Autofill the form
        </p>
        <p className="mt-1 text-sm text-slate-600">
          A local browser worker opens the posting and fills standard fields
          for you. It stops before submit so you stay in control.
        </p>
      </div>

      <ol className="mt-5 space-y-5 text-sm text-slate-700">
        <li>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">
              01
            </span>
            <p className="font-medium text-slate-900">
              Make sure the worker is installed (one-time setup).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInstall((current) => !current)}
            className="ml-7 mt-1 text-xs font-medium text-sky-700 underline"
          >
            {showInstall ? "Hide install commands" : "Show install commands"}
          </button>
          {showInstall ? (
            <pre className="ml-7 mt-3 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-6 text-slate-100">
              <code>{`cd worker
npm install
npx playwright install chromium
cp .env.example .env   # fill SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY`}</code>
            </pre>
          ) : null}
        </li>

        <li>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">
              02
            </span>
            <p className="font-medium text-slate-900">
              Run autofill for this application.
            </p>
          </div>
          <div className="ml-7 mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs leading-6 text-slate-100">
              {command}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-900 transition hover:bg-slate-100"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="ml-7 mt-2 text-xs text-slate-500">
            Run from the repo root in a terminal. A browser window opens
            automatically.
          </p>
        </li>

        <li>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">
              03
            </span>
            <p className="font-medium text-slate-900">Review, then submit.</p>
          </div>
          <p className="ml-7 mt-1 text-sm text-slate-600">
            The worker stops before final submit by design. Review the form,
            attach your resume, click submit yourself, then come back here and
            mark the application submitted.
          </p>
        </li>
      </ol>
    </div>
  );
}
