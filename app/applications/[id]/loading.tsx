export default function ApplicationDetailLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 h-3 w-32 animate-pulse rounded-full bg-slate-200" />
        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-9 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
        </section>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          </section>
          <section className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 w-full animate-pulse rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200"
              />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
