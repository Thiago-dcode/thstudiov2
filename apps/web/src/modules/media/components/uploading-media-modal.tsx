"use client";

import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UploadMedia, useMedia } from "../providers/media.provider";

/**
 * Immediate feedback that an upload is under way.
 *
 * Until this existed the only signal was the media's websocket notification, which does not
 * arrive until the API has accepted the file — and the create dialog closes the instant it
 * hands off (`setOpen(false)` then `handleUploadInserts()`). Between those two moments the
 * screen looked exactly as it did before the user pressed the button.
 *
 * Deliberately shows only work still in progress: once an upload lands, the notification
 * drawer is the thing that reports it, and duplicating that here would leave two places
 * disagreeing about the same media.
 */

/** Literal union rather than `string`: next-intl checks the key against the message tree. */
type UploadStatusKey =
  | "queued"
  | "preparingUpload"
  | "uploading"
  | "updating"
  | "generatingSeo"
  | "deleting";

/** Queued items have no slot yet, so `pending` is what separates them from work in flight. */
const statusKey = (mediaUpload: UploadMedia): UploadStatusKey => {
  if (!mediaUpload.pending) return "queued";

  switch (mediaUpload.action) {
    case "edit":
      return "updating";
    case "seo":
      return "generatingSeo";
    case "delete":
      return "deleting";
    default:
      // A create has no id until the API answers; before that nothing has been sent yet.
      return mediaUpload.id ? "uploading" : "preparingUpload";
  }
};

const UploadingRow = ({ mediaUpload }: { mediaUpload: UploadMedia }) => {
  const t = useTranslations("atelier.media.uploadStatus");
  const title =
    mediaUpload.input.file?.name ||
    mediaUpload.input.seo_title ||
    t("unknownFile");

  return (
    <div className="flex items-center gap-3 p-2">
      <div className="relative size-12 shrink-0 overflow-hidden border border-border bg-fg-2">
        {mediaUpload.previewUrl ? (
          <img
            src={mediaUpload.previewUrl}
            alt={t("previewAlt")}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="size-4 text-text-muted" aria-hidden />
          </div>
        )}
        {mediaUpload.pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Spinner className="size-5 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-text-muted">{t(statusKey(mediaUpload))}</p>
      </div>
    </div>
  );
};

export const UploadingMediaModal = () => {
  const t = useTranslations("atelier.media.uploadStatus");
  const { mediaInProgress } = useMedia();

  if (!mediaInProgress.length) return null;

  return (
    <output
      aria-live="polite"
      className="z-200 pointer-events-auto max-w-80 w-full max-h-100 flex flex-col overflow-hidden border border-border bg-fg shadow-lg"
    >
      <div className="flex items-start gap-3 border-b border-border px-4 py-3 shrink-0">
        <Spinner className="size-5 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{t("uploadingFiles")}</h3>
          <p className="text-xs text-text-muted">
            {t("remaining", { count: mediaInProgress.length })}
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-1 px-2 py-2">
          {mediaInProgress.map((mediaUpload) => (
            <UploadingRow
              key={`media-uploading-${mediaUpload.unique_id}`}
              mediaUpload={mediaUpload}
            />
          ))}
        </div>
      </div>
    </output>
  );
};
