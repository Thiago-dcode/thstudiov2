"use client";

import { useTranslations } from "next-intl";
import type { UploadMedia } from "@/modules/media/providers/media.provider";

/** Still preview of a file that has not been uploaded yet. */
export function StagedMediaPreview({
  media,
  index,
}: {
  media: UploadMedia;
  index: number;
}) {
  const t = useTranslations("atelier.media.upload");
  const alt = t("previewAlt", { index: index + 1 });

  // A video blob in an <img> renders as a broken image. `muted` + no controls keeps this a still
  // preview — `preload="metadata"` fetches only enough of the local blob to paint the first frame.
  if (media.input.file?.type.startsWith("video/")) {
    return (
      <video
        src={media.previewUrl}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className="max-h-full max-w-full object-contain"
      />
    );
  }

  return (
    <img
      src={media.previewUrl}
      alt={alt}
      className="max-h-full max-w-full object-contain"
    />
  );
}
