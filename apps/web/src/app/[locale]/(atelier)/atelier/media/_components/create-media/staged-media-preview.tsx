"use client";

import { MediaHelper } from "@repo/common-lib/utils/media";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { UploadMedia } from "@/modules/media/providers/media.provider";

/**
 * Parks a staged video on the frame its cover will be: the one the artist picked, or — when they
 * picked none — the same inset frame the worker takes by default, so the card never shows a
 * black opening frame the published cover will not have.
 */
function showCoverFrame(
  video: HTMLVideoElement,
  pickedSeconds: number | null | undefined,
) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const seconds =
    pickedSeconds ?? MediaHelper.videoFrameEdgeOffsetSeconds(video.duration);
  video.currentTime = Math.min(seconds, video.duration);
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const coverSeconds = media.input.thumbnail_time_seconds;

  // A new pick on an already-loaded video; the first load is handled by `onLoadedMetadata`.
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      showCoverFrame(video, coverSeconds);
    }
  }, [coverSeconds]);

  // A video blob in an <img> renders as a broken image. `muted` + no controls keeps this a still
  // preview — `preload="metadata"` fetches only enough of the local blob to paint a frame.
  if (media.input.file?.type.startsWith("video/")) {
    return (
      <video
        ref={videoRef}
        src={media.previewUrl}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className="max-h-full max-w-full object-contain"
        onLoadedMetadata={(event) =>
          showCoverFrame(event.currentTarget, coverSeconds)
        }
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
