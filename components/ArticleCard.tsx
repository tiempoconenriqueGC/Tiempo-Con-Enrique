"use client";

import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/types/article";
import { formatArticleDate } from "@/lib/format";

type ArticleCardProps = {
  article: Article;
  isAdmin: boolean;
  onEdit: (article: Article) => void;
};

export function ArticleCard({ article, isAdmin, onEdit }: ArticleCardProps) {
  return (
    <article className="grid gap-5 border-b border-border py-8 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] sm:gap-8 sm:py-10">
      <Link
        href={`/noticias/${article.slug}`}
        className="relative aspect-[16/10] overflow-hidden border border-border bg-black/[0.03]"
      >
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt=""
            fill
            sizes="(min-width: 768px) 360px, 100vw"
            className="object-cover grayscale transition duration-500 hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Sin imagen
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.16em] text-muted">
            <time dateTime={article.published_at}>
              {formatArticleDate(article.published_at)}
            </time>
            {article.updated_at ? (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={article.updated_at}>
                  Editada {formatArticleDate(article.updated_at)}
                </time>
              </>
            ) : null}
          </div>

          <Link href={`/noticias/${article.slug}`}>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-normal transition hover:text-muted sm:text-4xl">
              {article.title}
            </h2>
          </Link>

          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            {article.excerpt}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/noticias/${article.slug}`}
            className="text-sm underline underline-offset-4 transition hover:text-muted"
          >
            Leer noticia
          </Link>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => onEdit(article)}
              className="border border-black px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
            >
              Editar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
