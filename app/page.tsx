"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [jobUrl, setJobUrl] = useState("");

  function handleStartApplication() {
    const trimmedUrl = jobUrl.trim();

    if (!trimmedUrl) {
      router.push("/apply");
      return;
    }

    router.push(`/apply?jobUrl=${encodeURIComponent(trimmedUrl)}`);
  }

  return (
    <main className="text-slate-900">
      {/* ───────── Hero — gradient with light/dark variants in globals.css ───────── */}
      <section className="hero-band relative overflow-hidden px-6 pb-20 pt-16 sm:px-8 sm:pt-20 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-200/60">
            For CS students applying to SWE internships
          </span>

          <h1 className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Apply to internships faster —
            <br />
            <span className="text-sky-700">without sounding like a bot.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Paste a Greenhouse or Lever job link. JobPilot drafts a tailored
            cover letter and short-answer responses in your voice, using your
            resume and writing samples. You edit. You send.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleStartApplication();
            }}
            className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <input
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="Paste a Greenhouse or Lever job link"
              aria-label="Job posting URL"
            />
            <button
              type="submit"
              className="rounded-full bg-slate-950 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Build my draft
            </button>
          </form>

          <Link
            href="#how-it-works"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
          >
            See how it works
            <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </section>

      {/* ───────── How it works — neutral light gray ───────── */}
      <section
        id="how-it-works"
        className="bg-slate-100 px-6 py-20 sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Three steps from job link to draft.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              You stay in control of the writing. JobPilot just makes the first
              draft a lot less painful.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Save your profile once.",
                body: "Upload your resume, 2–3 writing samples, and standard application details. JobPilot stores them and reuses them across every application.",
              },
              {
                step: "02",
                title: "Paste a URL, answer 3 questions.",
                body: "Drop in a Greenhouse or Lever posting. Answer three quick calibration questions about why this role, why this company, what to emphasize.",
              },
              {
                step: "03",
                title: "Edit your draft. Send.",
                body: "JobPilot generates a cover letter and short-answer drafts in your voice. You edit them, mark the application submitted, and move on.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 font-mono text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  {step}
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── What you get — soft mint ───────── */}
      <section className="bg-emerald-50 px-6 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              What you get
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Drafts that read like you, not like AI.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Cover letters in your voice.",
                body: "Trained on your past writing samples — not generic prompts. Three-paragraph structure, grounded in your real experience, no buzzwords.",
              },
              {
                title: "Short answers, ready to edit.",
                body: "JobPilot extracts the posting's questions and drafts an answer to each. Original draft kept separately from your edits — never overwritten.",
              },
              {
                title: "Your profile, reused everywhere.",
                body: "Standard fields, links, work authorization, school details — saved once, applied to every Greenhouse or Lever posting you paste.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-emerald-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Closing CTA — always dark, theme-stable ─────────
          Uses arbitrary value `bg-[#0a0a0f]` (not `bg-slate-950`) on purpose
          so the dark-mode rescue layer in globals.css does NOT flip it to
          white. That rescue is correct for inline primary buttons, but would
          invert this whole hero band in dark mode. */}
      <section className="bg-[#0a0a0f] px-6 py-20 text-white sm:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight !text-white sm:text-4xl">
            Ready to apply?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/75">
            Sign in, upload a resume, and paste your first job link. Your next
            draft is one URL away.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/apply"
              className="rounded-full bg-[#ffffff] px-7 py-3.5 text-sm font-semibold !text-[#0a0a0f] transition hover:bg-slate-100"
            >
              Start my draft
            </Link>
            <Link
              href="/profile"
              className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold !text-white transition hover:bg-white/10"
            >
              Open profile
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
