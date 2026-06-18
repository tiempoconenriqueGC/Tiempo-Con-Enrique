import Image from "next/image";
import Link from "next/link";
import { AdminAuth } from "@/components/AdminAuth";

type HeaderProps = {
  userEmail: string | null;
  isAdmin: boolean;
  compact?: boolean;
};

export function Header({ userEmail, isAdmin, compact = false }: HeaderProps) {
  return (
    <header className="mx-auto w-full max-w-5xl px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-tce.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover grayscale"
            priority
          />
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Noticias meteorológicas
          </span>
        </Link>

        <AdminAuth userEmail={userEmail} isAdmin={isAdmin} />
      </div>

      <div className={compact ? "mt-10 border-b border-border pb-8" : "mt-14 border-b border-border pb-12"}>
        <Link href="/">
          <h1
            className={
              compact
                ? "text-4xl font-medium leading-none tracking-normal sm:text-6xl"
                : "text-6xl font-medium leading-none tracking-normal sm:text-8xl"
            }
          >
            Tiempo Con Enrique
          </h1>
        </Link>
      </div>
    </header>
  );
}
