"use client";

import { useState, useTransition } from "react";
import { toggleArticleLikeAction } from "@/app/actions/likes";

type ArticleLikeButtonProps = {
  articleId: string;
  slug: string;
  initialLikesCount: number;
  initialLikedByCurrentUser: boolean;
  isAuthenticated: boolean;
};

export function ArticleLikeButton({
  articleId,
  slug,
  initialLikesCount,
  initialLikedByCurrentUser,
  isAuthenticated
}: ArticleLikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [liked, setLiked] = useState(initialLikedByCurrentUser);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleLike() {
    setMessage(null);

    if (!isAuthenticated) {
      setMessage("Inicia sesion o registrate para dar like.");
      return;
    }

    startTransition(async () => {
      const previousLiked = liked;
      const previousLikesCount = likesCount;
      const nextLiked = !previousLiked;

      setLiked(nextLiked);
      setLikesCount(Math.max(0, previousLikesCount + (nextLiked ? 1 : -1)));

      const result = await toggleArticleLikeAction(articleId, slug);

      if (!result.ok) {
        setLiked(previousLiked);
        setLikesCount(previousLikesCount);
        setMessage(result.message ?? "No se pudo guardar el like.");
        return;
      }

      setLiked(Boolean(result.liked_by_current_user));
      setLikesCount(Number(result.likes_count ?? 0));
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isPending}
        aria-pressed={liked}
        aria-label={liked ? "Quitar like" : "Dar like"}
        title={liked ? "Quitar like" : "Dar like"}
        className="group inline-flex h-10 items-center gap-2.5 text-lg leading-none transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={
            liked
              ? "text-3xl leading-none text-red-600 transition group-hover:scale-110"
              : "text-3xl leading-none text-black transition group-hover:scale-110 group-hover:text-red-600"
          }
        >
          {liked ? "\u2665" : "\u2661"}
        </span>
        <span className="font-mono text-lg text-black">{likesCount}</span>
      </button>

      {message ? <p className="max-w-56 text-xs leading-5 text-muted">{message}</p> : null}
    </div>
  );
}
