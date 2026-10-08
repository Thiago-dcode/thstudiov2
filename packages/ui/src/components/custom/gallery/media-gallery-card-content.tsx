"use client";

import { aspectRatioToCss } from "@repo/common-lib/utils/aspect-ratio";
import { useGallery } from "@repo/ui/providers/gallery.provider";
import { Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { MediaTypeBadge } from "../media-type-badge";
import type { GalleryGridMedia } from "./gallery-grid";

type MediaGalleryCardContentProps = {
  media: GalleryGridMedia;
  /** Position in the gallery; the first few tiles are the LCP candidates. */
  index: number;
  /** Layout-specific classes (fit, transition) shared by the `<img>` and the `<video>`. */
  mediaClassName: string;
};

const FRAME_CLASS_NAME = "media-gallery-card__frame relative overflow-hidden w-full h-full";

/**
 * A video tile: the poster until the pointer (or keyboard focus) reaches the card, then the
 * muted, looping clip. A big, faint play button sits over the poster as the cue and fades out
 * while the clip plays.
 *
 * Playback is tied to the enclosing `.media-gallery-card` (the `group`) rather than to this
 * frame, so hovering anywhere on the tile counts. Touch devices never hover, so there the
 * button simply stays and the lightbox does the playing.
 */
function HoverPlayVideo({
  src,
  poster,
  className,
  aspectRatio,
}: {
  src: string;
  poster?: string;
  className: string;
  aspectRatio: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const card = frameRef.current?.closest<HTMLElement>(".media-gallery-card");
    const video = videoRef.current;
    if (!card || !video) return;

    const play = () => {
      video.play().catch(() => {});
    };
    const stop = () => {
      video.pause();
      // Back to the first frame, so the tile rests on the same picture it started on.
      video.currentTime = 0;
    };

    card.addEventListener("mouseenter", play);
    card.addEventListener("mouseleave", stop);
    card.addEventListener("focus", play);
    card.addEventListener("blur", stop);
    return () => {
      card.removeEventListener("mouseenter", play);
      card.removeEventListener("mouseleave", stop);
      card.removeEventListener("focus", play);
      card.removeEventListener("blur", stop);
    };
  }, []);

  return (
    <div ref={frameRef} className={FRAME_CLASS_NAME}>
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        disableRemotePlayback
        disablePictureInPicture
        preload="none"
        poster={poster}
        className={className}
        // A clip has no intrinsic size until its metadata loads (`preload="none"`), so the
        // media's own ratio keeps the box from collapsing to the 300x150 default — the cell
        // sizing itself (grid spans, `aspect-ratio`) is still owned by gallery-grid.css.
        style={{ aspectRatio }}
        aria-hidden="true"
      >
        <source src={src} type="video/mp4" />
      </video>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ease-out group-hover:opacity-0 group-focus:opacity-0"
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-black/15 text-white/70 backdrop-blur-[2px] md:size-24">
          <Play className="ml-1 size-9 fill-current md:size-11" strokeWidth={1.5} />
        </span>
      </span>
    </div>
  );
}

/**
 * What a gallery tile shows inside its card.
 *
 * - IMAGE / GIF: the static WebP thumbnail. An animated media stays a poster here — the badge
 *   says so and the lightbox plays the real thing.
 * - VIDEO: the `video_preview` clip, played on hover. Without a preview it falls back to the
 *   thumbnail poster.
 * - Anything without a usable asset renders a placeholder that keeps the cell's size.
 */
export function MediaGalleryCardContent({
  media,
  index,
  mediaClassName,
}: MediaGalleryCardContentProps) {
  const { labels } = useGallery();
  const alt = media.seo_alt || media.title || labels.altFallback;

  const preview = media.media_type === "VIDEO" ? media.video_preview : null;

  if (preview) {
    return (
      <HoverPlayVideo
        src={preview}
        poster={media.thumbnail ?? undefined}
        className={mediaClassName}
        aspectRatio={aspectRatioToCss(media.aspect_ratio)}
      />
    );
  }

  if (media.thumbnail) {
    return (
      <div className={FRAME_CLASS_NAME}>
        <Image
          // `priority`, not `preload` — `preload` is not a next/image prop, so it was forwarded to
          // the DOM as an unknown attribute and preloaded nothing. Without `unoptimized` these now
          // go through the image optimizer (the CloudFront host is in `remotePatterns`, derived from
          // CDN_URL at build time), which is what actually moves LCP on a gallery page.
          priority={index < 5}
          src={media.thumbnail}
          alt={alt}
          width={800}
          height={1000}
          // The optimizer re-encodes an already-lossy thumbnail; its default q75 stacks a second
          // visible loss on top. Must be listed in `images.qualities` (apps/web/next.config.ts).
          quality={90}
          className={mediaClassName}
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        {/* The thumbnail is a static poster even for an animated media; the badge says so, and
            the lightbox plays the real thing. */}
        <MediaTypeBadge mediaType={media.media_type} />
      </div>
    );
  }

  return (
    <div className="media-gallery-card__frame media-gallery-card__placeholder w-full h-full aspect-square flex items-center justify-center bg-fg text-xs text-text-muted ">
      void
    </div>
  );
}
