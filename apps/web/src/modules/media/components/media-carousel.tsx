"use client";

import type { MediaWithUser } from "@repo/common-lib/types/media";
import { MediaTypeBadge } from "@repo/ui/components/custom/media-type-badge";
import { cn } from "@repo/ui/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import NextImage from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const AUTOPLAY_INTERVAL = 7000;

export const MediaCarousel = ({ media }: { media: MediaWithUser[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 100 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || isPaused || media.length <= 1) return;
    const id = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [emblaApi, isPaused, media.length]);

  if (!media.length) return null;

  const activeUser = media[selectedIndex]?.user;
  const hasControls = false;

  return (
    <div
      className="flex w-full max-w-full  tablet:max-w-2xl desktop-lg:max-w-4xl flex-col gap-0.5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {media.map((item) => {
            const src = item.thumbnail?.trim() || item.url;
            return (
              <div key={item.id} className="min-w-0 flex-[0_0_100%]">
                <div className="relative aspect-video tablet:aspect-video w-full overflow-hidden bg-fg">
                  {src ? (
                    <NextImage
                      src={src}
                      alt={item.seo_alt || item.title || ""}
                      fill
                      className="object-cover"
                      // Was `(min-width: 768px)` — a media condition with no length, which is not
                      // a valid `sizes` entry, so the browser fell back to 100vw everywhere.
                      sizes="(min-width: 768px) 672px, 100vw"
                    />
                  ) : null}
                  <MediaTypeBadge mediaType={item.media_type} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {activeUser?.username ? (
        <Link
          href={`/artists/${encodeURIComponent(activeUser.username)}`}
          className="pl-1 w-fit text-sm text-text-muted transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none"
        >
          @{activeUser.username}
        </Link>
      ) : null}
      {hasControls ? (
        <div className="flex items-center justify-between">
          <CarouselButton label="Previous slide" onClick={scrollPrev}>
            <ChevronLeft />
          </CarouselButton>
          <CarouselButton label="Next slide" onClick={scrollNext}>
            <ChevronRight />
          </CarouselButton>
        </div>
      ) : null}
    </div>
  );
};

function CarouselButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-em",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="size-5"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="square" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="size-5"
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="square" />
    </svg>
  );
}
