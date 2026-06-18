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
    <header className="relative mx-auto w-full max-w-5xl px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="flex items-center pr-16 sm:pr-40">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo-tce.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover grayscale"
            priority
          />
          <span className="hidden font-mono text-xs uppercase tracking-[0.22em] text-muted sm:inline">
            Noticias meteorológicas
          </span>
        </Link>

        <div className="absolute right-5 top-8 sm:right-8 sm:top-12">
          <AdminAuth userEmail={userEmail} isAdmin={isAdmin} />
        </div>
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
