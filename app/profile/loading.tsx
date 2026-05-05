export default function ProfileLoading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-9 w-1/2 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm" />
        </div>
      </div>
    </main>
  );
}
