export default function ApplyLoading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-9 w-2/3 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-3 h-10 w-32 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
