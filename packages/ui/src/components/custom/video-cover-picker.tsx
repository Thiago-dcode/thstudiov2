"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Slider } from "../shadcn/slider";

/** Fine enough to land on a single frame at 20fps+; Shift/PageUp move ten of these. */
const STEP_SECONDS = 0.05;

/** `75.4` → `1:15.4`. Tenths only: the thumb cannot be placed finer than that by hand. */
export function formatCoverTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = (safe - minutes * 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${rest}`;
}

function seek(video: HTMLVideoElement | null, seconds: number) {
  if (video && Math.abs(video.currentTime - seconds) > 0.001) {
    video.currentTime = seconds;
  }
}

/**
 * Scrub a video and pick the frame to use as its cover.
 *
 * The frame shown IS the video element, seeked — nothing is drawn to a canvas, so a remote source
 * needs no CORS and the bytes the server extracts from never pass through the browser. Only the
 * picked second leaves this component, through `onCommit` on release (or on each keyboard step):
 * dragging previews, it does not commit.
 *
 * When the browser cannot decode the file (HEVC on most non-Apple browsers, for one), the picker
 * says so and calls `onUnsupported`; the server still extracts a default cover.
 *
 * Key it by `src` if the source can change: what it learned about one video (its duration,
 * whether it plays) is not reset for the next.
 */
export function VideoCoverPicker({
  src,
  value,
  defaultSeconds,
  onCommit,
  onUnsupported,
  disabled = false,
  sliderLabel,
  videoLabel,
  unsupportedLabel,
  className,
}: {
  src: string;
  /** The committed cover second; `null`/`undefined` opens on `defaultSeconds`. */
  value: number | null | undefined;
  /** Where the cover is when none was picked, given the video's duration. Defaults to 0. */
  defaultSeconds?: (durationSeconds: number) => number;
  onCommit: (seconds: number) => void;
  onUnsupported?: () => void;
  disabled?: boolean;
  /** Accessible name of the scrubber, e.g. "Cover frame". */
  sliderLabel: string;
  /** Accessible name of the video frame. */
  videoLabel: string;
  /** Shown in place of the picker when the file cannot be played here. */
  unsupportedLabel: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  // Only while the thumb is moving; otherwise the position IS the committed value.
  const [dragPosition, setDragPosition] = useState<number | null>(null);

  const committed =
    duration === null
      ? null
      : Math.min(value ?? defaultSeconds?.(duration) ?? 0, duration);
  const position = dragPosition ?? committed ?? 0;

  // Show the committed frame once the video can seek, and again whenever the value moves.
  useEffect(() => {
    if (committed === null || dragPosition !== null) return;
    seek(videoRef.current, committed);
  }, [committed, dragPosition]);

  function markUnsupported() {
    setUnsupported(true);
    onUnsupported?.();
  }

  if (unsupported) {
    return (
      <div
        role="status"
        className={cn(
          "flex aspect-video w-full items-center justify-center border border-border bg-fg-2 p-4 text-center text-xs text-text-muted",
          className,
        )}
      >
        {unsupportedLabel}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden border border-border bg-fg-2 tablet:aspect-square">
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          // Metadata only: the source may be a stored video of hundreds of megabytes, and each
          // seek fetches just the range it needs (a local upload's blob is instant either way).
          preload="metadata"
          aria-label={videoLabel}
          className="max-h-full max-w-full object-contain"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            // An undecodable video track still loads metadata on some browsers — with no
            // picture: zero dimensions, or no finite duration to scrub across.
            if (
              !Number.isFinite(video.duration) ||
              video.duration <= 0 ||
              video.videoWidth === 0
            ) {
              markUnsupported();
              return;
            }
            setDuration(video.duration);
          }}
          onError={markUnsupported}
        />
      </div>

      <div className="space-y-2">
        <Slider
          value={[position]}
          min={0}
          max={duration ?? 1}
          step={STEP_SECONDS}
          disabled={disabled || duration === null}
          thumbProps={{
            "aria-label": sliderLabel,
            "aria-valuetext":
              duration === null
                ? undefined
                : `${formatCoverTime(position)} / ${formatCoverTime(duration)}`,
          }}
          onValueChange={([next]) => {
            if (next === undefined) return;
            setDragPosition(next);
            seek(videoRef.current, next);
          }}
          onValueCommit={([next]) => {
            setDragPosition(null);
            if (next === undefined) return;
            onCommit(next);
          }}
        />
        <div
          className="flex justify-between text-xs tabular-nums text-text-muted"
          aria-hidden
        >
          <span>{formatCoverTime(position)}</span>
          <span>{duration === null ? "–" : formatCoverTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
