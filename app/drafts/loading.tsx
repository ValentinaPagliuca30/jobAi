export default function DraftsLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-8 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-9 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        </section>
        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
