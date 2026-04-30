import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listSubmittedApplications } from "@/lib/submitted-applications";
import { buttonClasses } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatAppliedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function groupByMonth(items: ReadonlyArray<{ appliedAt: string }>) {
  const map = new Map<string, number>();
  for (const item of items) {
    const date = new Date(item.appliedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([key, count]) => {
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return {
        key,
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
        }).format(date),
        count,
      };
    });
}

export default async function SucceedPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-3xl">
              Sign in to track your applications.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Submitted applications appear here once you log in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let applications = [] as Awaited<ReturnType<typeof listSubmittedApplications>>;
  let errorMessage: string | null = null;

  try {
    applications = await listSubmittedApplications(userId);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load submitted applications.";
  }

  const monthly = groupByMonth(applications);
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthCount =
    monthly.find((entry) => entry.key === thisMonthKey)?.count ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Submitted
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Track every application you sent.
          </h1>
        </div>
        <Link href="/apply" className={buttonClasses("default", "md")}>
          New application
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total submitted" value={applications.length} />
        <StatCard label="This month" value={thisMonthCount} />
        <StatCard label="Months tracked" value={monthly.length} />
      </div>

      {monthly.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {monthly.map((entry) => (
            <Badge key={entry.key} variant="success">
              {entry.label} · {entry.count}
            </Badge>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : applications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Applied at</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.companyName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.jobTitle || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAppliedDate(application.appliedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Applied</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={application.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClasses("outline", "sm")}
                      >
                        Open
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              No submitted applications yet. Finish one application and press
              submit from its detail page to save it here.
            </div>
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
