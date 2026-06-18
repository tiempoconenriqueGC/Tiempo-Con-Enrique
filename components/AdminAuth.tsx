"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AdminAuthProps = {
  userEmail: string | null;
  isAdmin: boolean;
};

export function AdminAuth({ userEmail, isAdmin }: AdminAuthProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      setOpen(false);
      setPassword("");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cerrar la sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[12rem] truncate text-xs text-muted sm:block">
          {isAdmin ? "Admin" : "Lector"} · {userEmail}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="border border-black px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Salir
        </button>
        {error ? <span className="sr-only">{error}</span> : null}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-black px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
      >
        Admin
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Acceso de administrador"
            className="w-full max-w-sm border border-black bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-medium">Acceso admin</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 w-full border border-border px-3 py-3 outline-none transition focus:border-black"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-muted">
                  Contraseña
                </span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-2 w-full border border-border px-3 py-3 outline-none transition focus:border-black"
                />
              </label>

              {error ? <p className="text-sm text-muted">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black px-4 py-3 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
