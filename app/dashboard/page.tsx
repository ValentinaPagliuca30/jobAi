import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listJobApplications } from "@/lib/job-applications";
import { buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { userId } = await auth();
  let applications = [] as Awaited<ReturnType<typeof listJobApplications>>;
  let errorMessage: string | null = null;

  if (userId) {
    try {
      applications = await listJobApplications(userId);
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard applications.";
    }
  }

  const openCount = applications.filter((a) => a.status !== "submitted").length;
  const submittedCount = applications.filter(
    (a) => a.status === "submitted",
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Track drafts, reviews, and submissions.
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Control center for application state, generation history, and quick
          re-entry into the review flow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open drafts" value={openCount} />
        <StatCard label="Submitted" value={submittedCount} />
        <StatCard label="Supported ATS" value={2} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Recent applications</CardTitle>
            <CardDescription>Curated, narrow, and demo-safe.</CardDescription>
          </div>
          <Link href="/apply" className={buttonClasses("outline", "sm")}>
            New intake
          </Link>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <p>
                Dashboard could not load applications yet. Run the SQL in{" "}
                <code>supabase/job-applications-migration.sql</code>, then
                refresh.
              </p>
              <p className="mt-2">Database error: {errorMessage}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No demo applications yet. Start from{" "}
              <Link href="/apply" className="underline">
                /apply
              </Link>{" "}
              to parse a posting and create the first record.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {applications.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/applications/${application.id}`}
                    className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {application.companyName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.jobTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{application.atsType}</Badge>
                      <Badge
                        variant={
                          application.status === "submitted"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {application.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
