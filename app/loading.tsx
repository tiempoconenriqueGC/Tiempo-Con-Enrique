export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-12 sm:px-8">
      <div className="h-12 w-3/4 animate-pulse bg-black/10" />
      <div className="mt-12 space-y-8">
        <div className="h-44 animate-pulse border border-border bg-black/[0.03]" />
        <div className="h-44 animate-pulse border border-border bg-black/[0.03]" />
      </div>
    </main>
  );
}
