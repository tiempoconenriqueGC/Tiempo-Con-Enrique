"use client";

import { useState } from "react";
import { AdminFloatingButton } from "@/components/AdminFloatingButton";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleEditorModal } from "@/components/ArticleEditorModal";
import type { Article } from "@/types/article";

type ArticleFeedProps = {
  articles: Article[];
  isAdmin: boolean;
  isAuthenticated: boolean;
};

export function ArticleFeed({
  articles,
  isAdmin,
  isAuthenticated
}: ArticleFeedProps) {
  const [creating, setCreating] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  return (
    <>
      {articles.length === 0 ? (
        <div className="border-b border-border py-20">
          <p className="text-xl text-muted">Todavía no hay noticias publicadas.</p>
        </div>
      ) : (
        <div>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              onEdit={setEditingArticle}
            />
          ))}
        </div>
      )}

      {isAdmin ? (
        <>
          <AdminFloatingButton onClick={() => setCreating(true)} />
          {creating ? (
            <ArticleEditorModal mode="create" onClose={() => setCreating(false)} />
          ) : null}
          {editingArticle ? (
            <ArticleEditorModal
              mode="edit"
              article={editingArticle}
              onClose={() => setEditingArticle(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
