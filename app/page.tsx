"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Job application intake
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Paste one job URL and start the application flow.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Log in, paste a Greenhouse or Lever link, and JobPilot prepares the
          application using your saved profile, uploads, and reusable answers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Start an application</CardTitle>
            <CardDescription>
              Supports <code className="text-xs">jobs.lever.co</code> and{" "}
              <code className="text-xs">boards.greenhouse.io</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-url">Job posting URL</Label>
              <Input
                id="job-url"
                value={jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                placeholder="https://jobs.lever.co/example/software-engineer-intern"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleStartApplication}>Start application</Button>
              <Link
                href="/profile"
                className={buttonClasses("outline", "md")}
              >
                Open profile
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What gets reused</CardTitle>
            <CardDescription>
              JobPilot pulls these from your profile to fill the form and seed
              the draft.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                Personal details and links
              </li>
              <li className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                CV, transcript, and cover letters
              </li>
              <li className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                General answers reused across forms
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
