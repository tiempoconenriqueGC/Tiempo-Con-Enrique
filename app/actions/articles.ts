"use server";

import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type {
  ArticleActionResult,
  ArticleMutationPayload,
  UploadedArticleImage
} from "@/types/article";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const TITLE_MAX_LENGTH = 180;
const EXCERPT_MAX_LENGTH = 360;

function cleanText(value: string, maxLength: number) {
  return sanitizeHtml(value ?? "", {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanContent(value: string) {
  return sanitizeHtml(value ?? "", {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "blockquote"
    ],
    allowedAttributes: {
      a: ["href", "rel", "target"],
      span: ["style"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedStyles: {
      span: {
        "font-size": [/^\d+(px|rem|em|%)$/]
      }
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        {
          rel: "noopener noreferrer",
          target: "_blank"
        },
        true
      )
    }
  }).trim();
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `noticia-${Date.now()}`;
}

function normalizePayload(payload: ArticleMutationPayload) {
  const title = cleanText(payload.title, TITLE_MAX_LENGTH);
  const excerpt = cleanText(payload.excerpt, EXCERPT_MAX_LENGTH);
  const content = cleanContent(payload.content);

  if (!title) {
    throw new Error("El título es obligatorio.");
  }

  if (!excerpt) {
    throw new Error("El resumen es obligatorio.");
  }

  if (!content || content === "<p></p>") {
    throw new Error("El cuerpo de la noticia es obligatorio.");
  }

  const images = payload.images
    .filter((image) => image.image_url && image.storage_path)
    .map((image, index) => ({
      id: image.id,
      image_url: image.image_url,
      storage_path: image.storage_path,
      sort_order: index
    }));

  return {
    title,
    excerpt,
    content,
    images,
    removedImageIds: payload.removedImageIds ?? []
  };
}

async function requireAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Necesitas iniciar sesión como admin.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new Error("No tienes permisos de administrador.");
  }

  return user;
}

async function makeUniqueSlug(
  supabase: SupabaseClient,
  title: string,
  excludeArticleId?: string
) {
  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase.from("articles").select("id").eq("slug", candidate).limit(1);

    if (excludeArticleId) {
      query = query.neq("id", excludeArticleId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function removeStorageObjects(
  supabase: SupabaseClient,
  storagePaths: string[]
) {
  const paths = storagePaths.filter(Boolean);

  if (paths.length === 0) {
    return;
  }

  await supabase.storage.from("news-images").remove(paths);
}

export async function createArticleAction(
  payload: ArticleMutationPayload
): Promise<ArticleActionResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  try {
    const supabase = await createClient();
    const user = await requireAdmin(supabase);
    const cleanPayload = normalizePayload(payload);
    const slug = await makeUniqueSlug(supabase, cleanPayload.title);
    const coverImage = cleanPayload.images[0]?.image_url ?? null;

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        title: cleanPayload.title,
        slug,
        excerpt: cleanPayload.excerpt,
        content: cleanPayload.content,
        cover_image_url: coverImage,
        author_id: user.id,
        status: "published",
        published_at: new Date().toISOString()
      })
      .select("id, slug")
      .single();

    if (articleError || !article) {
      throw articleError ?? new Error("No se pudo crear la noticia.");
    }

    if (cleanPayload.images.length > 0) {
      const { error: imagesError } = await supabase.from("article_images").insert(
        cleanPayload.images.map((image) => ({
          article_id: article.id,
          image_url: image.image_url,
          storage_path: image.storage_path,
          sort_order: image.sort_order
        }))
      );

      if (imagesError) {
        throw imagesError;
      }
    }

    revalidatePath("/");
    revalidatePath(`/noticias/${article.slug}`);

    return { ok: true, slug: article.slug };
  } catch (caughtError) {
    return {
      ok: false,
      message:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo crear la noticia."
    };
  }
}

export async function updateArticleAction(
  articleId: string,
  payload: ArticleMutationPayload
): Promise<ArticleActionResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  try {
    const supabase = await createClient();
    await requireAdmin(supabase);
    const cleanPayload = normalizePayload(payload);

    const { data: previousArticle, error: previousError } = await supabase
      .from("articles")
      .select("id, slug")
      .eq("id", articleId)
      .single();

    if (previousError || !previousArticle) {
      throw previousError ?? new Error("La noticia no existe.");
    }

    if (cleanPayload.removedImageIds.length > 0) {
      const { data: removedImages, error: removedSelectError } = await supabase
        .from("article_images")
        .select("id, storage_path")
        .eq("article_id", articleId)
        .in("id", cleanPayload.removedImageIds);

      if (removedSelectError) {
        throw removedSelectError;
      }

      await removeStorageObjects(
        supabase,
        (removedImages ?? []).map((image) => image.storage_path)
      );

      const { error: deleteImagesError } = await supabase
        .from("article_images")
        .delete()
        .eq("article_id", articleId)
        .in("id", cleanPayload.removedImageIds);

      if (deleteImagesError) {
        throw deleteImagesError;
      }
    }

    for (const image of cleanPayload.images) {
      if (image.id) {
        const { error } = await supabase
          .from("article_images")
          .update({
            sort_order: image.sort_order,
            image_url: image.image_url,
            storage_path: image.storage_path
          })
          .eq("id", image.id)
          .eq("article_id", articleId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("article_images").insert({
          article_id: articleId,
          image_url: image.image_url,
          storage_path: image.storage_path,
          sort_order: image.sort_order
        });

        if (error) {
          throw error;
        }
      }
    }

    const slug = await makeUniqueSlug(supabase, cleanPayload.title, articleId);
    const coverImage = cleanPayload.images[0]?.image_url ?? null;
    const { error: articleError } = await supabase
      .from("articles")
      .update({
        title: cleanPayload.title,
        slug,
        excerpt: cleanPayload.excerpt,
        content: cleanPayload.content,
        cover_image_url: coverImage,
        updated_at: new Date().toISOString()
      })
      .eq("id", articleId);

    if (articleError) {
      throw articleError;
    }

    revalidatePath("/");
    revalidatePath(`/noticias/${previousArticle.slug}`);
    revalidatePath(`/noticias/${slug}`);

    return { ok: true, slug };
  } catch (caughtError) {
    return {
      ok: false,
      message:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar la noticia."
    };
  }
}

export async function deleteArticleAction(
  articleId: string
): Promise<ArticleActionResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { data: article, error: articleSelectError } = await supabase
      .from("articles")
      .select("id, slug, article_images(storage_path)")
      .eq("id", articleId)
      .single();

    if (articleSelectError || !article) {
      throw articleSelectError ?? new Error("La noticia no existe.");
    }

    const storagePaths =
      article.article_images?.map((image: { storage_path: string }) => image.storage_path) ??
      [];

    await removeStorageObjects(supabase, storagePaths);

    const { error: deleteError } = await supabase
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath("/");
    revalidatePath(`/noticias/${article.slug}`);

    return { ok: true };
  } catch (caughtError) {
    return {
      ok: false,
      message:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar la noticia."
    };
  }
}
