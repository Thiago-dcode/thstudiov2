"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UploadMedia } from "../providers/media.provider";
import { statusKey } from "./upload-media-status-modal";

/**
 * Creates still in flight that a list does not show yet. Once the media's first notification
 * lands the list renders the real row (with its own loading overlay), so the placeholder steps
 * aside instead of showing the same file twice.
 */
export const uploadsNotInList = (
  uploads: UploadMedia[],
  media: { id: number }[],
): UploadMedia[] => {
  const shownIds = new Set(media.map((m) => m.id));
  return uploads.filter((upload) => !upload.id || !shownIds.has(upload.id));
};

export const useUploadTitle = (upload: UploadMedia) => {
  const t = useTranslations("atelier.media.uploadStatus");
  return upload.input.file?.name || upload.input.seo_title || t("unknownFile");
};

/**
 * Square preview of a file that is still uploading: the local preview under a spinner and the
 * same status line the upload panel shows, so the list itself says the work is running.
 */
export const UploadingMediaTile = ({
  upload,
  className,
}: {
  upload: UploadMedia;
  className?: string;
}) => {
  const t = useTranslations("atelier.media.uploadStatus");
  const title = useUploadTitle(upload);

  // Same window as the panel: the percentage only describes the S3 transfer, before `id` lands.
  const progress = upload.pending && !upload.id ? upload.progress : undefined;
  const hasProgress = typeof progress === "number";
  const label = hasProgress
    ? t("uploadingPercent", { percent: progress })
    : t(statusKey(upload));

  return (
    <div
      role="status"
      aria-busy
      aria-label={`${title}: ${label}`}
      title={title}
      className={cn(
        "relative aspect-square w-full overflow-hidden bg-fg-2",
        className,
      )}
    >
      {upload.previewUrl ? (
        <img
          src={upload.previewUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="size-6 text-text-muted" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 px-3 text-center">
        <Spinner className="size-8 text-white" />
        <p className="text-[11px]! leading-snug! text-white">{label}</p>
        {hasProgress && (
          <div className="h-1 w-full max-w-24 overflow-hidden bg-white/30">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
