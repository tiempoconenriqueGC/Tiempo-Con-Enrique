"use client";

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-md border border-border p-8">
        <h1 className="text-2xl font-medium">Algo no ha cargado bien.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Reintenta la carga de la página.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 border border-black px-4 py-2 text-sm transition hover:bg-black hover:text-white"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
