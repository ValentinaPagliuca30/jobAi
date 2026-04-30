import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DeleteDraftButton } from "./delete-draft-button";
import { listDraftJobApplications } from "@/lib/job-applications";
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

function formatDraftDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function groupByMonth(items: ReadonlyArray<{ createdAt: string }>) {
  const map = new Map<string, number>();
  for (const item of items) {
    const date = new Date(item.createdAt);
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

function statusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DraftsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl">Sign in to see your drafts.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unfinished applications appear here once you log in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const drafts = await listDraftJobApplications(userId);
  const monthly = groupByMonth(drafts);
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthCount =
    monthly.find((entry) => entry.key === thisMonthKey)?.count ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Drafts
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Resume unfinished applications.
          </h1>
        </div>
        <Link href="/apply" className={buttonClasses("default", "md")}>
          New draft
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open drafts" value={drafts.length} />
        <StatCard label="This month" value={thisMonthCount} />
        <StatCard label="Months tracked" value={monthly.length} />
      </div>

      {monthly.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {monthly.map((entry) => (
            <Badge key={entry.key} variant="secondary">
              {entry.label} · {entry.count}
            </Badge>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {drafts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-medium">
                      {draft.companyName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {draft.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {draft.jobTitle || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDraftDate(draft.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning">{statusLabel(draft.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/applications/${draft.id}`}
                          className={buttonClasses("default", "sm")}
                        >
                          Continue
                        </Link>
                        <DeleteDraftButton applicationId={draft.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
              No drafts yet. Start a new application from{" "}
              <Link href="/apply" className="underline">
                /apply
              </Link>{" "}
              and unfinished records will appear here automatically.
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
