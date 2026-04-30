import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listSubmittedApplications } from "@/lib/submitted-applications";

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
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Succeed
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Sign in to track your applications.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              Submitted applications appear here once you log in.
            </p>
          </section>
        </div>
      </main>
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
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 text-sm text-slate-500">
          Home <span className="mx-2">/</span> Succeed
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Succeed
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Track every application you sent.
              </h1>
            </div>
            <Link
              href="/apply"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              New application
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Total submitted
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {applications.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                This month
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {thisMonthCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Months tracked
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {monthly.length}
              </p>
            </div>
          </div>

          {monthly.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {monthly.map((entry) => (
                <span
                  key={entry.key}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {entry.label} · {entry.count}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          {errorMessage ? (
            <div className="rounded-2xl bg-[var(--peach)] px-5 py-5">
              <p className="text-sm leading-7 text-[var(--ink)]">{errorMessage}</p>
            </div>
          ) : applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Company
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Location
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Position
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Applied at
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 text-right">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {application.companyName || "—"}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {application.location ?? "—"}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {application.jobTitle || "—"}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {formatAppliedDate(application.appliedAt)}
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Applied
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm leading-7 text-slate-600">
                No submitted applications yet. Finish one application and press
                submit from its detail page to save it here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
