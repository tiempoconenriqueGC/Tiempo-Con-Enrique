"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AdminAuthProps = {
  userEmail: string | null;
  isAdmin: boolean;
};

type AuthMode = "sign-in" | "sign-up";

export function AdminAuth({ userEmail, isAdmin }: AdminAuthProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm(nextMode = mode) {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });

        if (error) {
          throw error;
        }

        setPassword("");

        if (data.session) {
          setOpen(false);
          router.refresh();
          return;
        }

        setMessage("Revisa tu correo para confirmar la cuenta.");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      setOpen(false);
      setPassword("");
      router.refresh();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo completar la accion."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cerrar la sesion."
      );
    } finally {
      setLoading(false);
    }
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[12rem] truncate text-xs text-muted sm:block">
          {isAdmin ? "Admin" : "Usuario"} - {userEmail}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="border border-black px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Salir
        </button>
        {message ? <span className="sr-only">{message}</span> : null}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetForm("sign-in");
          setOpen(true);
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center border border-black text-xs uppercase transition hover:bg-black hover:text-white sm:w-auto sm:px-3 sm:py-2 sm:tracking-[0.16em]"
      >
        <span className="sm:hidden">In</span>
        <span className="hidden sm:inline">Entrar</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-5 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cuenta de usuario"
            className="w-full max-w-sm border border-black bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-medium">Cuenta</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 border border-border">
              <button
                type="button"
                onClick={() => resetForm("sign-in")}
                className={
                  mode === "sign-in"
                    ? "bg-black px-3 py-2 text-xs uppercase tracking-[0.16em] text-white"
                    : "px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black/[0.04]"
                }
              >
                Iniciar
              </button>
              <button
                type="button"
                onClick={() => resetForm("sign-up")}
                className={
                  mode === "sign-up"
                    ? "bg-black px-3 py-2 text-xs uppercase tracking-[0.16em] text-white"
                    : "px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black/[0.04]"
                }
              >
                Registro
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  Contrasena
                </span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  className="mt-2 w-full border border-border px-3 py-3 outline-none transition focus:border-black"
                />
              </label>

              {message ? <p className="text-sm leading-6 text-muted">{message}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black px-4 py-3 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Procesando..."
                  : mode === "sign-up"
                    ? "Crear cuenta"
                    : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
