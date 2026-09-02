"use client";

import type { Media } from "@repo/common-lib/types/media";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { cn } from "@repo/ui/lib/utils";
import { Expand } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Everything the dialog needs; deliberately not the whole `Media` so callers can pass a subset. */
export type ExpandableMedia = Pick<
  Media,
  "url" | "thumbnail" | "media_type" | "title" | "seo_alt" | "seo_filename"
>;

type Props = {
  media: ExpandableMedia;
  /** Overrides the derived alt/aria text. Callers with better context should pass one. */
  alt?: string;
  /** Positioning and look of the trigger. It is absolutely positioned by every caller so far. */
  className?: string;
};

/**
 * Opens a media's full asset (`url`) in a dialog, next to wherever its small poster is shown.
 *
 * Listings across the app render `thumbnail` — a static WebP poster, even for GIF and video —
 * so there is otherwise no way to see the real asset without leaving the page. This bundles the
 * trigger and the dialog together because the two are useless apart and the trigger carries
 * event-isolation that is easy to forget: several call sites nest it inside another clickable
 * element (a drawer trigger, a selectable tile), and Radix listens on `pointerdown`, so stopping
 * `click` alone still activates the parent.
 *
 * The caller owns placement via `className`. Check what already occupies the corners of the
 * host tile — badges and per-card actions differ between the atelier grid and the media picker.
 */
export function ExpandMediaDialog({ media, alt, className }: Props) {
  const t = useTranslations("atelier.common");
  const [open, setOpen] = useState(false);

  // `url` is null until the worker finishes processing, and the poster is all that exists
  // before then — nothing to expand, so no affordance.
  if (!media.url) return null;

  const label = alt || media.seo_alt || media.title || media.seo_filename || "";

  return (
    <>
      <button
        type="button"
        aria-label={t("expandMedia")}
        // Both handlers: a parent Radix trigger (drawer, dialog) activates on pointerdown, so
        // stopping click alone would still open it behind this dialog.
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          // Always visible rather than revealed on group-hover: a hover-only control is
          // unreachable on touch, and these grids are used on tablets.
          "flex items-center justify-center bg-black/50 p-1.5 text-white transition-colors duration-200 hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
          className,
        )}
      >
        <Expand className="size-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Sized to the media, not the viewport. `sm:w-fit` is required as well as `w-fit`:
            DialogContent's base classes carry `sm:w-full`, and tailwind-merge treats a
            variant-prefixed class as its own conflict group, so an unprefixed `w-fit` does
            not override it and the dialog stretches full-width above 640px.
            `pt-10` reserves a strip for the built-in close X (absolute right-4 top-4), which
            would otherwise sit on the artwork and be unreadable against a light image.
            `z-100` so it clears a host drawer or dialog it was opened from. */}
        <DialogContent className="w-fit sm:w-fit max-w-[95vw] p-2 pt-10 sm:p-3 sm:pt-10 z-100">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {media.title || media.seo_filename || t("expandMedia")}
            </DialogTitle>
            <DialogDescription>{t("expandMedia")}</DialogDescription>
          </DialogHeader>
          {media.media_type === "VIDEO" ? (
            // No caption track: media is artist-uploaded artwork and the platform stores no
            // subtitles, so an empty <track> would assert accessibility we do not have.
            // biome-ignore lint/a11y/useMediaCaption: no caption source exists for uploaded media
            <video
              src={media.url}
              poster={media.thumbnail ?? undefined}
              controls
              playsInline
              // Only the header up front: a video may be hundreds of megabytes, and the poster
              // paints immediately while the file downloads on play.
              preload="metadata"
              aria-label={label}
              className="block max-h-[80vh] max-w-[calc(95vw-1.5rem)] w-auto h-auto object-contain"
            />
          ) : (
            // Plain <img>, not next/image: atelier media is served through presigned S3 URLs
            // whose host is not in `images.remotePatterns`, so the optimizer rejects them —
            // and there is nothing to optimize for a one-off modal.
            <img
              src={media.url}
              alt={label}
              className="block max-h-[80vh] max-w-[calc(95vw-1.5rem)] w-auto h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
