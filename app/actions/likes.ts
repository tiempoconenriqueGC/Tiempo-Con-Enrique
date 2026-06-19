"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { ArticleLikeActionResult } from "@/types/article";

type LikeSummary = {
  likes_count: number | string;
  liked_by_current_user: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function toggleArticleLikeAction(
  articleId: string,
  slug?: string
): Promise<ArticleLikeActionResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase no esta configurado." };
  }

  if (!UUID_PATTERN.test(articleId)) {
    return { ok: false, message: "La noticia no es valida." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        ok: false,
        message: "Inicia sesion o registrate para dar like."
      };
    }

    const { data, error } = await supabase.rpc("toggle_article_like", {
      target_article_id: articleId
    });

    if (error) {
      throw error;
    }

    const summary = (Array.isArray(data) ? data[0] : data) as LikeSummary | undefined;

    revalidatePath("/");

    if (slug) {
      revalidatePath(`/noticias/${slug}`);
    }

    return {
      ok: true,
      likes_count: Number(summary?.likes_count ?? 0),
      liked_by_current_user: Boolean(summary?.liked_by_current_user)
    };
  } catch (caughtError) {
    return {
      ok: false,
      message:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el like."
    };
  }
}
