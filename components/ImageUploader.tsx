"use client";

import Image from "next/image";

export type EditableImage = {
  localId: string;
  id?: string;
  image_url?: string;
  storage_path?: string;
  file?: File;
  previewUrl: string;
};

type ImageUploaderProps = {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  removedImageIds: string[];
  onRemovedImageIdsChange: (ids: string[]) => void;
};

export function ImageUploader({
  images,
  onChange,
  removedImageIds,
  onRemovedImageIdsChange
}: ImageUploaderProps) {
  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextImages = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    onChange([...images, ...nextImages]);
  }

  function removeImage(image: EditableImage) {
    if (image.id && !removedImageIds.includes(image.id)) {
      onRemovedImageIdsChange([...removedImageIds, image.id]);
    }

    if (image.file) {
      URL.revokeObjectURL(image.previewUrl);
    }

    onChange(images.filter((item) => item.localId !== image.localId));
  }

  return (
    <div>
      <label className="flex min-h-28 cursor-pointer items-center justify-center border border-dashed border-neutral-400 px-4 py-6 text-center text-sm text-muted transition hover:border-black hover:text-black">
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        Subir imágenes
      </label>

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div key={image.localId} className="group relative aspect-square border border-border bg-black/[0.03]">
              <Image
                src={image.previewUrl}
                alt=""
                fill
                sizes="160px"
                className="object-cover grayscale"
                unoptimized={image.previewUrl.startsWith("blob:")}
              />
              <div className="absolute left-2 top-2 bg-white/90 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
                {index === 0 ? "Portada" : index + 1}
              </div>
              <button
                type="button"
                onClick={() => removeImage(image)}
                className="absolute right-2 top-2 bg-white/95 px-2 py-1 text-xs uppercase tracking-[0.14em] opacity-100 transition hover:bg-black hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Sin imágenes.</p>
      )}
    </div>
  );
}
