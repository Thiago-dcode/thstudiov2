"use client";

import { useFullscreen } from "@repo/ui/hooks/useFullscreen";
import { cn } from "@repo/ui/lib/utils";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FullscreenMediaProps {
  url: string;
  alt: string;
  title?: string;
}

export const FullscreenMedia = ({ url, alt, title }: FullscreenMediaProps) => {
  const { ref, fullscreen, toggleFullscreen } = useFullscreen<HTMLElement>();
  const t = useTranslations("artists.fullscreen");

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

      <img
        src={url}
        alt={alt}
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
