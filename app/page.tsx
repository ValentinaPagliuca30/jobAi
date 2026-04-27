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
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 text-sm text-slate-500">
          Home <span className="mx-2">/</span> Job URL Tool
        </div>

        <section className="rounded-[2rem] bg-[linear-gradient(180deg,#d9efff_0%,#edf7ff_32%,#ffffff_100%)] p-4 shadow-[0_30px_80px_rgba(80,120,180,0.12)] sm:p-6 lg:p-8">
          <div className="rounded-[2rem] border-[3px] border-dashed border-slate-300 bg-white px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Job application intake
                </div>
                <h1 className="text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Paste one job URL and start the application flow.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                  This page should feel like a simple tool. You log in, paste a
                  Greenhouse or Lever link, and the app uses your saved profile,
                  uploads, and reusable answers to prepare the application.
                </p>

                <div className="mt-8">
                  <label className="block text-sm font-medium text-slate-800">
                    Job posting URL
                  </label>
                  <input
                    value={jobUrl}
                    onChange={(event) => setJobUrl(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                    placeholder="Paste a Greenhouse or Lever job link here"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleStartApplication}
                    className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Start application
                  </button>
                  <Link
                    href="/profile"
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open profile
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-3xl text-sky-700">
                    ↗
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                    One link in.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Behind this screen the app should pull from your profile:
                    contact info, school data, work authorization, reusable
                    answers, CV, transcript, and cover letter material.
                  </p>
                  <ul className="mt-5 space-y-3 text-sm text-slate-700">
                    <li className="rounded-2xl bg-sky-50 px-4 py-3">Personal details and links</li>
                    <li className="rounded-2xl bg-orange-50 px-4 py-3">CV, transcript, and cover letters</li>
                    <li className="rounded-2xl bg-emerald-50 px-4 py-3">General answers reused across forms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
