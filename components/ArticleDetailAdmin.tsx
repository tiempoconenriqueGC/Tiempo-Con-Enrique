"use client";

import { useState } from "react";
import { ArticleEditorModal } from "@/components/ArticleEditorModal";
import type { Article } from "@/types/article";

type ArticleDetailAdminProps = {
  article: Article;
};

export function ArticleDetailAdmin({ article }: ArticleDetailAdminProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 border border-black px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
      >
        Editar
      </button>

      <ArticleEditorModal
        open={open}
        mode="edit"
        article={article}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
