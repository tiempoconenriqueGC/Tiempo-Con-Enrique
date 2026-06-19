import { ArticleFeed } from "@/components/ArticleFeed";
import { Header } from "@/components/Header";
import { getCurrentProfile, getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articlesResult, auth] = await Promise.all([
    getPublishedArticles(),
    getCurrentProfile()
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header userEmail={auth.userEmail} isAdmin={auth.isAdmin} />

      <section className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        {articlesResult.error ? (
          <div className="mb-8 border border-border px-4 py-3 text-sm text-muted">
            No se pudieron cargar las noticias. {articlesResult.error}
          </div>
        ) : null}

        <ArticleFeed
          articles={articlesResult.articles}
          isAdmin={auth.isAdmin}
          isAuthenticated={auth.isAuthenticated}
        />
      </section>
    </main>
  );
}
