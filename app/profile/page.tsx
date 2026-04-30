"use client";

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
import { UploadsSection } from "./uploads-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

type TabKey = "basic" | "uploads" | "answers";

const tabItems: Array<{
  key: TabKey;
  title: string;
  description: string;
}> = [
  {
    key: "basic",
    title: "Basic information",
    description: "Contact, school, eligibility",
  },
  {
    key: "uploads",
    title: "Uploads",
    description: "CV, transcript, samples",
  },
  {
    key: "answers",
    title: "Application answers",
    description: "Reusable responses",
  },
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

        if (cancelled) return;

        setBasicInfo(payload.profile.basicInfo);
        setIdentityInfo(payload.profile.identityInfo);
        setApplicationAnswers(payload.profile.applicationAnswers);
        setHasLoadError(false);
      } catch (error) {
        if (!cancelled) {
          setHasLoadError(true);
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to load the profile.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
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
        headers: { "content-type": "application/json" },
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

      setStatusMessage("Profile saved.");
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Profile
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Complete your profile once, then reuse it.
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Basic information, uploads, and reusable answers — all in one place.
          </p>
        </div>
        <Button onClick={handleSaveProfile} disabled={isLoading || isSaving}>
          {isSaving ? "Saving…" : "Save profile"}
        </Button>
      </div>

      {statusMessage ? (
        <p className="rounded-md border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}
      {hasLoadError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          Run <code>supabase/profile-migration.sql</code> to align profile tables
          with the Clerk-based schema.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1" role="tablist">
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-1 flex-col items-start gap-0.5 rounded px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-medium">{tab.title}</span>
              <span className="text-xs text-muted-foreground">
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "basic" && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic information</CardTitle>
                <CardDescription>
                  Personal, academic, and eligibility details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {basicFieldDefinitions.map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-2">
                      <Label htmlFor={`basic-${key}`}>{label}</Label>
                      <Input
                        id={`basic-${key}`}
                        value={basicInfo[key]}
                        onChange={(event) =>
                          updateBasicField(key, event.target.value)
                        }
                        placeholder={placeholder}
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Self-identification</CardTitle>
                <CardDescription>
                  Optional standard answers for gender, race, veteran, and
                  disability status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {identityFieldDefinitions.map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-2">
                      <Label htmlFor={`id-${key}`}>{label}</Label>
                      <Input
                        id={`id-${key}`}
                        value={identityInfo[key]}
                        onChange={(event) =>
                          updateIdentityField(key, event.target.value)
                        }
                        placeholder={placeholder}
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-8 xl:h-fit">
            <CardHeader>
              <CardTitle className="text-base">In this section</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  Contact details and links
                </li>
                <li className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  School, degree, and graduation
                </li>
                <li className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  Work authorization and sponsorship
                </li>
                <li className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  Race, gender, veteran, disability
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "uploads" && <UploadsSection />}

      {activeTab === "answers" && (
        <Card>
          <CardHeader>
            <CardTitle>Application answers</CardTitle>
            <CardDescription>
              Reusable general responses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {answerBlockDefinitions.map((block) => (
                <div key={block} className="flex flex-col gap-2">
                  <Label htmlFor={`answer-${block}`}>{block}</Label>
                  <Textarea
                    id={`answer-${block}`}
                    value={applicationAnswers[block]}
                    onChange={(event) =>
                      updateAnswerField(block, event.target.value)
                    }
                    placeholder={`Write a reusable answer for: ${block}`}
                    disabled={isLoading}
                    className="min-h-32"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
