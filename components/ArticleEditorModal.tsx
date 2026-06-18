"use client";

import { FormEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  createArticleAction,
  deleteArticleAction,
  updateArticleAction
} from "@/app/actions/articles";
import { ImageUploader, type EditableImage } from "@/components/ImageUploader";
import { RichTextEditor } from "@/components/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import type {
  Article,
  ArticleActionResult,
  UploadedArticleImage
} from "@/types/article";

type ArticleEditorModalProps = {
  mode: "create" | "edit";
  article?: Article | null;
  onClose: () => void;
};

function existingImages(article: Article | null | undefined): EditableImage[] {
  return (
    article?.images.map((image) => ({
      localId: image.id,
      id: image.id,
      image_url: image.image_url,
      storage_path: image.storage_path,
      previewUrl: image.image_url
    })) ?? []
  );
}

function getSafeExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || "jpg";
}

export function ArticleEditorModal({
  mode,
  article,
  onClose
}: ArticleEditorModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const draftKeyRef = useRef<string>(article?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [images, setImages] = useState<EditableImage[]>(existingImages(article));
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    images.forEach((image) => {
      if (image.file) {
        URL.revokeObjectURL(image.previewUrl);
      }
    });
    onClose();
  }

  async function uploadPendingImages(): Promise<{
    images: UploadedArticleImage[];
    uploadedPaths: string[];
  }> {
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    const folder = article?.id ?? draftKeyRef.current;
    const uploadedImages: UploadedArticleImage[] = [];

    for (const [index, image] of images.entries()) {
      if (!image.file) {
        if (image.image_url && image.storage_path) {
          uploadedImages.push({
            id: image.id,
            image_url: image.image_url,
            storage_path: image.storage_path,
            sort_order: index
          });
        }
        continue;
      }

      const extension = getSafeExtension(image.file);
      const storagePath = `articles/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(storagePath, image.file, {
          cacheControl: "3600",
          contentType: image.file.type,
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(storagePath);
      const { data } = supabase.storage.from("news-images").getPublicUrl(storagePath);

      uploadedImages.push({
        image_url: data.publicUrl,
        storage_path: storagePath,
        sort_order: index
      });
    }

    return { images: uploadedImages, uploadedPaths };
  }

  async function cleanupUploadedImages(paths: string[]) {
    if (paths.length === 0) {
      return;
    }

    try {
      const supabase = createClient();
      await supabase.storage.from("news-images").remove(paths);
    } catch {
      // The database action will surface the original error to the editor.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    let uploadedPaths: string[] = [];

    try {
      const uploadResult = await uploadPendingImages();
      uploadedPaths = uploadResult.uploadedPaths;

      const payload = {
        title,
        excerpt,
        content,
        images: uploadResult.images,
        removedImageIds
      };

      let result: ArticleActionResult;

      if (mode === "edit" && article) {
        result = await updateArticleAction(article.id, payload);
      } else {
        result = await createArticleAction(payload);
      }

      if (!result.ok) {
        throw new Error(result.message ?? "No se pudo guardar la noticia.");
      }

      closeModal();

      if (mode === "edit" && result.slug && pathname.startsWith("/noticias/")) {
        router.push(`/noticias/${result.slug}`);
      }

      router.refresh();
    } catch (caughtError) {
      await cleanupUploadedImages(uploadedPaths);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar la noticia."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!article) {
      return;
    }

    const confirmed = window.confirm(
      "¿Eliminar esta noticia? Esta acción no se puede deshacer."
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await deleteArticleAction(article.id);

      if (!result.ok) {
        throw new Error(result.message ?? "No se pudo eliminar la noticia.");
      }

      closeModal();
      router.push("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar la noticia."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Editar noticia" : "Publicar noticia"}
        className="mx-auto flex h-full max-w-6xl flex-col border border-black bg-white"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {mode === "edit" ? "Edición" : "Nueva noticia"}
            </p>
            <h2 className="mt-1 text-2xl font-medium">
              {mode === "edit" ? "Editar noticia" : "Publicar noticia"}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-3xl leading-none"
            aria-label="Cerrar"
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.8fr_1.2fr]">
            <section className="border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <h3 className="text-sm font-medium uppercase tracking-[0.16em]">
                Imágenes
              </h3>
              <div className="mt-5">
                <ImageUploader
                  images={images}
                  onChange={setImages}
                  removedImageIds={removedImageIds}
                  onRemovedImageIdsChange={setRemovedImageIds}
                />
              </div>
            </section>

            <section className="p-5 sm:p-6">
              <h3 className="text-sm font-medium uppercase tracking-[0.16em]">
                Escritura
              </h3>
              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    Título
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={180}
                    className="mt-2 w-full border border-border px-3 py-3 text-lg outline-none transition focus:border-black"
                  />
                </label>

                <label className="block">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    Resumen
                  </span>
                  <textarea
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                    required
                    rows={4}
                    maxLength={360}
                    className="mt-2 w-full resize-y border border-border px-3 py-3 outline-none transition focus:border-black"
                  />
                </label>

                <div>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted">
                    Cuerpo
                  </span>
                  <div className="mt-2">
                    <RichTextEditor value={content} onChange={setContent} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              {mode === "edit" ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="border border-black px-4 py-3 text-sm uppercase tracking-[0.16em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Eliminar noticia
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {error ? <p className="text-sm text-muted">{error}</p> : null}
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="border border-border px-4 py-3 text-sm uppercase tracking-[0.16em] transition hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-black px-4 py-3 text-sm uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Publicar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
