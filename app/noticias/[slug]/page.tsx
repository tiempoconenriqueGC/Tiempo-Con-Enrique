import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleDetailAdmin } from "@/components/ArticleDetailAdmin";
import { ArticleLikeButton } from "@/components/ArticleLikeButton";
import { Header } from "@/components/Header";
import { getArticleBySlug, getCurrentProfile } from "@/lib/articles";
import { formatArticleDate } from "@/lib/format";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const { article } = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Noticia no encontrada | Tiempo Con Enrique"
    };
  }

  return {
    title: `${article.title} | Tiempo Con Enrique`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.cover_image_url ? [article.cover_image_url] : undefined
    }
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const [{ article }, auth] = await Promise.all([
    getArticleBySlug(slug),
    getCurrentProfile()
  ]);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header userEmail={auth.userEmail} isAdmin={auth.isAdmin} compact />

      <article className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-muted transition hover:text-black"
        >
          Inicio
        </Link>

        <div className="mt-8 flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {formatArticleDate(article.published_at)}
              {article.updated_at ? ` · Editada ${formatArticleDate(article.updated_at)}` : ""}
            </p>
            <h1 className="mt-5 text-4xl font-medium leading-tight tracking-normal sm:text-6xl">
              {article.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">{article.excerpt}</p>
            <div className="mt-6">
              <ArticleLikeButton
                articleId={article.id}
                slug={article.slug}
                initialLikesCount={article.likes_count}
                initialLikedByCurrentUser={article.liked_by_current_user}
                isAuthenticated={auth.isAuthenticated}
              />
            </div>
          </div>

          {auth.isAdmin ? <ArticleDetailAdmin article={article} /> : null}
        </div>

        {article.cover_image_url ? (
          <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden border border-border bg-black/[0.03]">
            <Image
              src={article.cover_image_url}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div
          className="article-content mt-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.images.length > 1 ? (
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {article.images.slice(1).map((image) => (
              <div
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden border border-border bg-black/[0.03]"
              >
                <Image
                  src={image.image_url}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 368px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </article>
    </main>
  );
}
