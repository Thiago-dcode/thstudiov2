"use client";

import type { EnumType } from "@repo/common-lib/constants/enums";
import {
  aspectRatioToPixels,
  DEFAULT_ASPECT_RATIO,
} from "@repo/common-lib/utils/aspect-ratio";
import { useFullscreen } from "@repo/ui/hooks/useFullscreen";
import { cn } from "@repo/ui/lib/utils";
import { Maximize2, Minimize2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface FullscreenMediaProps {
  url: string;
  alt: string;
  title?: string;
  aspectRatio?: EnumType<"ASPECT_RATIO">;
}

export const FullscreenMedia = ({
  url,
  alt,
  title,
  aspectRatio,
}: FullscreenMediaProps) => {
  const { ref, fullscreen, toggleFullscreen } = useFullscreen<HTMLElement>();
  const t = useTranslations("artists.fullscreen");
  // This is the LCP element of the most numerous indexable page type in the app, so it goes
  // through the image optimizer with `priority`. Dimensions come from the stored aspect ratio —
  // CSS still governs the rendered size; they only need the right proportions to avoid CLS.
  const { width, height } = aspectRatioToPixels(
    aspectRatio ?? DEFAULT_ASPECT_RATIO,
  );

  return (
    <figure
      ref={ref}
      className={cn(
        "group/media relative flex flex-col items-center justify-center w-full",
        fullscreen ? "bg-black h-screen" : "flex-1 min-h-[50vh]",
      )}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className={cn(
          "absolute z-10 cursor-pointer p-2.5 transition-all duration-300 focus:outline-none",
          fullscreen
            ? "top-5 left-5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm"
            : "top-3 right-3 text-white/0 group-hover/media:text-white/50 hover:text-white! bg-black/0 group-hover/media:bg-black/30 hover:bg-black/50! backdrop-blur-sm",
        )}
        aria-label={fullscreen ? t("exit") : t("enter")}
      >
        {fullscreen ? (
          <Minimize2 className="size-4" strokeWidth={1.5} />
        ) : (
          <Maximize2 className="size-4" strokeWidth={1.5} />
        )}
      </button>

      {fullscreen && (
        <button
          type="button"
          onClick={() => document.exitFullscreen()}
          className="absolute top-5 right-5 z-10 cursor-pointer p-2.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:outline-none"
          aria-label={t("exit")}
        >
          <X className="size-4" strokeWidth={1.5} />
        </button>
      )}

      <Image
        src={url}
        alt={alt}
        width={width}
        height={height}
        priority
        sizes="(max-width: 768px) 100vw, 90vw"
        className={cn(
          "object-contain select-none",
          fullscreen
            ? "max-w-[95vw] max-h-[90vh]"
            : "max-w-full max-h-[75vh] w-auto h-auto",
        )}
        draggable={false}
      />

      {fullscreen && title && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/60 font-medium tracking-wide max-w-[80vw] truncate">
          {title}
        </p>
      )}
    </figure>
  );
};
