"use client";

type AdminFloatingButtonProps = {
  onClick: () => void;
};

export function AdminFloatingButton({ onClick }: AdminFloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Publicar nueva noticia"
      title="Publicar nueva noticia"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-black text-3xl font-light leading-none text-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:bg-neutral-800 sm:bottom-8 sm:right-8"
    >
      +
    </button>
  );
}
