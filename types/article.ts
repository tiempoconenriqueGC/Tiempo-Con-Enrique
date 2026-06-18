export type UserRole = "reader" | "admin";

export type ArticleImage = {
  id: string;
  article_id: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  published_at: string;
  updated_at: string | null;
  author_id: string | null;
  status: "published" | "draft";
  images: ArticleImage[];
};

export type UploadedArticleImage = {
  id?: string;
  image_url: string;
  storage_path: string;
  sort_order: number;
};

export type ArticleMutationPayload = {
  title: string;
  excerpt: string;
  content: string;
  images: UploadedArticleImage[];
  removedImageIds?: string[];
};

export type ArticleActionResult = {
  ok: boolean;
  message?: string;
  slug?: string;
};
