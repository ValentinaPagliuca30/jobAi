export default function HomeLoading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
