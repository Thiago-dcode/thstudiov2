"use client";

import { cn } from "@repo/ui/lib/utils";
import { Pencil, Sparkles, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UploadMedia } from "@/modules/media/providers/media.provider";
import { stagedFileName } from "./staged-media.utils";
import { StagedMediaPreview } from "./staged-media-preview";

/**
 * One file waiting to be uploaded.
 *
 * The whole card is a single button so that everything a file carries — compression today,
 * title/description next — is reached the same way: click the file, edit the file. The card
 * itself shows only the picture and its name; size, type and settings live in the dialog, since
 * at four columns anything more wraps into noise.
 */
export function StagedMediaCard({
  media,
  index,
  isPossibleDuplicate = false,
  onOpenDetails,
  onRemove,
}: {
  media: UploadMedia;
  index: number;
  /** Another pending upload has the same file name and size. A hint, never a block. */
  isPossibleDuplicate?: boolean;
  onOpenDetails: (uniqueId: number) => void;
  onRemove: (uniqueId: number) => void;
}) {
  const t = useTranslations("atelier.media.upload");
  // The title the artist gave it, once they have — until then, the file it came from.
  const displayName =
    media.input.title?.trim() ||
    stagedFileName(media, t("previewAlt", { index: index + 1 }));

  return (
    // `relative` on the wrapper, not on the button: the remove control has to be a sibling of
    // the card button rather than a child of it — a button inside a button is invalid markup
    // and browsers drop the inner one from the tab order.
    <div className="group relative">
      <button
        type="button"
        onClick={() => onOpenDetails(media.unique_id)}
        aria-label={t("openDetailsAria", { name: displayName })}
        className="flex w-full flex-col border border-border bg-fg text-left transition-colors hover:border-border-em focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/40"
      >
        <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-fg-2">
          <StagedMediaPreview media={media} index={index} />

          {media.input.generate_metadata && (
            <span
              title={t("aiSeoBadge")}
              className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center bg-black/60 text-white"
            >
              <Sparkles className="size-3.5" aria-hidden />
              <span className="sr-only">{t("aiSeoBadge")}</span>
            </span>
          )}

          {/* Hover/focus reveal, so the grid stays quiet while the files are what you look at. */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="flex items-center gap-1.5 whitespace-nowrap bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
              <Pencil className="size-3" aria-hidden />
              {t("cardDetailsHint")}
            </span>
          </span>
        </span>

        <span className="flex min-w-0 items-center gap-1.5 px-2.5 py-2">
          {isPossibleDuplicate && (
            <span title={t("duplicateCardHint")} className="shrink-0">
              <TriangleAlert className="size-3.5 text-warning" aria-hidden />
              <span className="sr-only">{t("duplicateCardHint")}</span>
            </span>
          )}
          <span
            title={displayName}
            className="truncate text-xs font-medium text-text"
          >
            {displayName}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onRemove(media.unique_id)}
        aria-label={t("removeAria", { name: displayName })}
        className={cn(
          "absolute right-1.5 top-1.5 z-10 flex size-6 items-center justify-center bg-black/60 text-white transition-colors",
          "hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        )}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
