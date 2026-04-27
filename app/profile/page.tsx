"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  answerBlockDefinitions,
  basicFieldDefinitions,
  emptyApplicationAnswerValues,
  emptyBasicProfileValues,
  emptyIdentityProfileValues,
  identityFieldDefinitions,
  type AnswerBlockKey,
  type BasicFieldKey,
  type IdentityFieldKey,
  type PersistedProfilePayload,
} from "@/lib/profile";

type TabKey = "basic" | "uploads" | "answers";

const tabItems: Array<{
  key: TabKey;
  title: string;
  description: string;
}> = [
  {
    key: "basic",
    title: "Basic information",
    description: "Contact details, school, eligibility, demographic info",
  },
  {
    key: "uploads",
    title: "Uploads",
    description: "CV, transcript, cover letters, writing samples",
  },
  {
    key: "answers",
    title: "Application answers",
    description: "General responses reused across forms",
  },
];

const uploadCards = [
  "Resume / CV",
  "Transcript",
  "Cover letter samples",
  "Writing samples",
  "Portfolio PDF or project sheet",
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [basicInfo, setBasicInfo] = useState(emptyBasicProfileValues);
  const [identityInfo, setIdentityInfo] = useState(emptyIdentityProfileValues);
  const [applicationAnswers, setApplicationAnswers] = useState(
    emptyApplicationAnswerValues,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const payload = (await response.json()) as {
          profile?: PersistedProfilePayload;
          error?: string;
        };

        if (!response.ok || !payload.profile) {
          throw new Error(payload.error || "Failed to load the profile.");
        }

        if (cancelled) {
          return;
        }

        setBasicInfo(payload.profile.basicInfo);
        setIdentityInfo(payload.profile.identityInfo);
        setApplicationAnswers(payload.profile.applicationAnswers);
        setHasLoadError(false);
      } catch (error) {
        if (!cancelled) {
          setHasLoadError(true);
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Failed to load the profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateBasicField(key: BasicFieldKey, value: string) {
    setBasicInfo((current) => ({ ...current, [key]: value }));
  }

  function updateIdentityField(key: IdentityFieldKey, value: string) {
    setIdentityInfo((current) => ({ ...current, [key]: value }));
  }

  function updateAnswerField(key: AnswerBlockKey, value: string) {
    setApplicationAnswers((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveProfile() {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          basicInfo,
          identityInfo,
          applicationAnswers,
        } satisfies PersistedProfilePayload),
      });

      const payload = (await response.json()) as {
        profile?: PersistedProfilePayload;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Failed to save the profile.");
      }

      setStatusMessage("Profile saved to the database.");
      setHasLoadError(false);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save the profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-lg font-semibold text-sky-700">
              J
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                JobPilot
              </p>
              <p className="text-xs text-slate-500">Profile setup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isLoading || isSaving}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 text-sm text-slate-500">
          Home <span className="mx-2">/</span> Profile
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            Profile
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Complete your profile once, then reuse it for every application.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Keep this page structured and calm: basic information, uploads, and
            reusable answers. Click one section and show only that section.
          </p>
          {statusMessage ? (
            <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {statusMessage}
            </p>
          ) : null}
          {hasLoadError ? (
            <p className="mt-3 rounded-2xl bg-[var(--peach)] px-4 py-3 text-sm text-[var(--ink)]">
              Run `supabase/profile-migration.sql` in Supabase to align the
              profile tables with the Clerk-based schema.
            </p>
          ) : null}
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    isActive
                      ? "rounded-2xl bg-slate-950 px-5 py-4 text-left text-white"
                      : "rounded-2xl bg-slate-50 px-5 py-4 text-left text-slate-900 transition hover:bg-slate-100"
                  }
                >
                  <div className="text-sm font-semibold">{tab.title}</div>
                  <div className={isActive ? "mt-1 text-sm text-white/70" : "mt-1 text-sm text-slate-500"}>
                    {tab.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {activeTab === "basic" && (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                      Basic information
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      Personal, academic, and eligibility details
                    </h2>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    Active tab
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {basicFieldDefinitions.map(({ key, label, placeholder }) => (
                    <label key={key} className="block text-sm font-medium text-slate-800">
                      {label}
                      <input
                        value={basicInfo[key]}
                        onChange={(event) => updateBasicField(key, event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                        placeholder={placeholder}
                        disabled={isLoading}
                      />
                    </label>
                  ))}
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                  Self-identification
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Optional demographic fields
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Save standard answers for gender, race, veteran status, and disability
                  status so they are available when forms ask for them.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {identityFieldDefinitions.map(({ key, label, placeholder }) => (
                    <label key={key} className="block text-sm font-medium text-slate-800">
                      {label}
                      <input
                        value={identityInfo[key]}
                        onChange={(event) => updateIdentityField(key, event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                        placeholder={placeholder}
                        disabled={isLoading}
                      />
                    </label>
                  ))}
                </div>
              </article>
            </div>

            <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-8 xl:h-fit">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                In this section
              </span>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                <li className="rounded-2xl bg-slate-50 px-4 py-3">Contact details and links</li>
                <li className="rounded-2xl bg-slate-50 px-4 py-3">School, degree, and graduation</li>
                <li className="rounded-2xl bg-slate-50 px-4 py-3">Work authorization and sponsorship</li>
                <li className="rounded-2xl bg-slate-50 px-4 py-3">Race, gender, veteran, disability</li>
              </ul>
            </aside>
          </section>
        )}

        {activeTab === "uploads" && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              Uploads
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Documents to reuse
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {uploadCards.map((card) => (
                <div
                  key={card}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5"
                >
                  <p className="text-sm font-medium text-slate-900">{card}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    Save this once so future applications can pull it quickly.
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Upload file
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "answers" && (
          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Application answers
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Reusable general responses
            </h2>
            <div className="mt-5 space-y-4">
              {answerBlockDefinitions.map((block) => (
                <label key={block} className="block text-sm font-medium text-slate-800">
                  {block}
                  <textarea
                    value={applicationAnswers[block]}
                    onChange={(event) => updateAnswerField(block, event.target.value)}
                    className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                    placeholder={`Write a reusable answer for: ${block}`}
                    disabled={isLoading}
                  />
                </label>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
