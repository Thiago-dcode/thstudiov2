"use client";

import type { ReturnError } from "@repo/common-lib/types/response";
import { Button } from "@repo/ui/components/shadcn/button";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
  OctagonXIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { type UploadMedia, useMedia } from "../providers/media.provider";

/**
 * Immediate feedback on uploads: work still in progress and requests that failed, in one panel.
 *
 * Until this existed the only signal was the media's websocket notification, which does not
 * arrive until the API has accepted the file — and the create dialog closes the instant it
 * hands off (`setOpen(false)` then `handleUploadInserts()`). Between those two moments the
 * screen looked exactly as it did before the user pressed the button.
 *
 * Deliberately shows only work still in progress and failures: once an upload lands, the
 * notification drawer is the thing that reports it, and duplicating that here would leave two
 * places disagreeing about the same media.
 */

/** Literal union rather than `string`: next-intl checks the key against the message tree. */
type UploadStatusKey =
  | "queued"
  | "preparingUpload"
  | "processingNotify"
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
      // `id` is only assigned after `createAsync` returns — i.e. after the S3 PUT finished AND
      // the server has already taken over (`writeOriginalAndEnqueue` is running). Before that,
      // `preparingUpload`/the progress bar own the label; from that point on there is nothing
      // left for a byte-transfer status to describe, so it switches to the notify message.
      return mediaUpload.id ? "processingNotify" : "preparingUpload";
  }
};

/**
 * Work that still depends on this tab: bytes going out over its connection, or anything queued,
 * which has not even started and is only held in this tab's memory.
 */
const needsPageOpen = (mediaUpload: UploadMedia) =>
  !mediaUpload.pending || (mediaUpload.action === "create" && !mediaUpload.id);

const requestErrorLines = (
  error: ReturnError<Record<string, string>>,
): string[] => {
  const fromErrors = error.errors?.filter(Boolean) ?? [];
  const fromInputs = Object.values(error.inputErrors ?? {}).filter(
    (message): message is string => typeof message === "string" && !!message,
  );
  return fromErrors.length ? fromErrors : fromInputs;
};

const RowThumbnail = ({
  mediaUpload,
  fallback,
}: {
  mediaUpload: UploadMedia;
  fallback: ReactNode;
}) => {
  const t = useTranslations("atelier.media.uploadStatus");
  return (
    <div className="relative size-12 shrink-0 overflow-hidden border border-border bg-fg-2">
      {mediaUpload.previewUrl ? (
        <img
          src={mediaUpload.previewUrl}
          alt={t("previewAlt")}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {fallback}
        </div>
      )}
      {mediaUpload.pending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Spinner className="size-5 text-white" />
        </div>
      )}
    </div>
  );
};

const useRowTitle = (mediaUpload: UploadMedia) => {
  const t = useTranslations("atelier.media.uploadStatus");
  return (
    mediaUpload.input.file?.name ||
    mediaUpload.input.seo_title ||
    t("unknownFile")
  );
};

const UploadingRow = ({ mediaUpload }: { mediaUpload: UploadMedia }) => {
  const t = useTranslations("atelier.media.uploadStatus");
  const title = useRowTitle(mediaUpload);

  // The window `progress` applies to. Once `id` lands the server already has everything it
  // needs, and `statusKey` already switches the main label to the notify copy on its own.
  const isTransferring =
    mediaUpload.action === "create" && mediaUpload.pending && !mediaUpload.id;
  const progress = isTransferring ? mediaUpload.progress : undefined;
  const hasProgress = typeof progress === "number";

  const label = hasProgress
    ? t("uploadingPercent", { percent: progress })
    : t(statusKey(mediaUpload));

  return (
    <div className="flex items-center gap-3 p-2">
      <RowThumbnail
        mediaUpload={mediaUpload}
        fallback={<ImageIcon className="size-4 text-text-muted" aria-hidden />}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs! font-medium truncate leading-snug!">{title}</p>
        <p className="text-[11px]! text-text-muted leading-snug!">{label}</p>
        {hasProgress && (
          <div className="h-1 w-full overflow-hidden bg-fg-2">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {needsPageOpen(mediaUpload) && (
          <p className="text-[10px]! text-warning leading-snug!">
            {t("doNotCloseWarning")}
          </p>
        )}
      </div>
    </div>
  );
};

const RequestErrorRow = ({ mediaUpload }: { mediaUpload: UploadMedia }) => {
  const t = useTranslations("atelier.media.uploadStatus");
  const title = useRowTitle(mediaUpload);
  const lines = mediaUpload.error
    ? requestErrorLines(mediaUpload.error)
    : [t("failedFallback")];

  return (
    <div className="flex items-start gap-3 p-2">
      <RowThumbnail
        mediaUpload={mediaUpload}
        fallback={<OctagonXIcon className="size-4 text-error" aria-hidden />}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs! font-medium truncate leading-snug!">{title}</p>
        {lines.map((line) => (
          <p key={line} className="text-[11px]! text-error leading-snug!">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};

export const UploadMediaStatusModal = () => {
  const t = useTranslations("atelier.media.uploadStatus");
  const tCommon = useTranslations("atelier.common");
  const { mediaInProgress, mediaRequestFailed, removeMediaUpload } = useMedia();
  const [minimized, setMinimized] = useState(false);

  const hasInProgress = mediaInProgress.length > 0;
  const hasFailed = mediaRequestFailed.length > 0;
  if (!hasInProgress && !hasFailed) return null;

  // Rows carry the warning when expanded; minimized, the header is all that is left to say it.
  const showHeaderWarning =
    minimized && mediaInProgress.some((upload) => needsPageOpen(upload));

  const dismissRequestErrors = () => {
    for (const upload of mediaRequestFailed) {
      removeMediaUpload(upload.unique_id);
    }
  };

  return (
    <output
      aria-live="polite"
      className={cn(
        "z-200 pointer-events-auto max-w-80 w-full flex flex-col overflow-hidden border border-border bg-fg shadow-lg",
        !minimized && "max-h-100",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3 shrink-0",
          !minimized && "border-b border-border",
        )}
      >
        {hasInProgress ? (
          <Spinner className="size-5 shrink-0 mt-0.5" />
        ) : (
          <OctagonXIcon
            className="size-5 text-error shrink-0 mt-0.5"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-sans! text-[13px]! font-semibold leading-snug!">
            {hasInProgress ? t("uploadingFiles") : t("requestFailed")}
          </h3>
          {hasInProgress && (
            <p className="text-[11px]! text-text-muted leading-snug!">
              {t("remaining", { count: mediaInProgress.length })}
            </p>
          )}
          {hasFailed && (
            <p className="text-[11px]! text-error leading-snug!">
              {t("requestFailedCount", { count: mediaRequestFailed.length })}
            </p>
          )}
          {showHeaderWarning && (
            <p className="text-[10px]! text-warning leading-snug!">
              {t("doNotCloseWarning")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMinimized((value) => !value)}
          aria-expanded={!minimized}
          aria-label={minimized ? t("expand") : t("minimize")}
          className="-mr-1.5 -mt-0.5 shrink-0 p-1 text-text-muted hover:text-text hover:bg-fg-2 transition-colors"
        >
          {minimized ? (
            <ChevronUpIcon className="size-4" aria-hidden />
          ) : (
            <ChevronDownIcon className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {!minimized && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-1 px-2 py-2">
              {mediaInProgress.map((mediaUpload) => (
                <UploadingRow
                  key={`media-uploading-${mediaUpload.unique_id}`}
                  mediaUpload={mediaUpload}
                />
              ))}
              {hasInProgress && hasFailed && (
                <p className="px-2 pt-2 text-[11px]! font-medium text-error">
                  {t("requestFailed")}
                </p>
              )}
              {mediaRequestFailed.map((mediaUpload) => (
                <RequestErrorRow
                  key={`media-request-error-${mediaUpload.unique_id}`}
                  mediaUpload={mediaUpload}
                />
              ))}
            </div>
          </div>
          {hasFailed && (
            <div className="border-t border-border px-4 py-3 shrink-0">
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={dismissRequestErrors}
              >
                {tCommon("close")}
              </Button>
            </div>
          )}
        </>
      )}
    </output>
  );
};
