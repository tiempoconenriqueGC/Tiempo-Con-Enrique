import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Article, ArticleImage, UserRole } from "@/types/article";

type ArticleRow = Omit<Article, "images"> & {
  article_images: ArticleImage[] | null;
};

const ARTICLE_SELECT = `
  id,
  title,
  slug,
  excerpt,
  content,
  cover_image_url,
  published_at,
  updated_at,
  author_id,
  status,
  article_images (
    id,
    article_id,
    image_url,
    storage_path,
    sort_order,
    created_at
  )
`;

function mapArticle(row: ArticleRow): Article {
  const images = [...(row.article_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    cover_image_url: row.cover_image_url ?? images[0]?.image_url ?? null,
    published_at: row.published_at,
    updated_at: row.updated_at,
    author_id: row.author_id,
    status: row.status,
    images
  };
}

export async function getPublishedArticles(): Promise<{
  articles: Article[];
  error?: string;
}> {
  if (!hasSupabaseEnv()) {
    return { articles: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return { articles: [], error: error.message };
  }

  return { articles: (data as ArticleRow[]).map(mapArticle) };
}

export async function getArticleBySlug(slug: string): Promise<{
  article: Article | null;
  error?: string;
}> {
  if (!hasSupabaseEnv()) {
    return { article: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return { article: null, error: error.message };
  }

  return { article: data ? mapArticle(data as ArticleRow) : null };
}

export async function getCurrentProfile(): Promise<{
  userEmail: string | null;
  role: UserRole | null;
  isAdmin: boolean;
}> {
  if (!hasSupabaseEnv()) {
    return { userEmail: null, role: null, isAdmin: false };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { userEmail: null, role: null, isAdmin: false };
  }

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (data?.role as UserRole | undefined) ?? null;

  return {
    userEmail: user.email ?? null,
    role,
    isAdmin: role === "admin"
  };
}
