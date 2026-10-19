"use client";

import { cn } from "@repo/ui/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export type RandomGridMediaItem = {
  url: string;
  isPortrait: boolean;
};

// Cell 0 is the only LCP candidate and the only preload. Cells 1–5 are on screen at every
// breakpoint but must not emit <link rel="preload"> — React preloads every loading="eager"
// image that is not fetchpriority="low", and six optimizer jobs on Slow 4G delayed LCP to
// 7.5s. Cells 7+ stay lazy so a phone never downloads the CSS-hidden columns.
const ALWAYS_VISIBLE_CELLS = 6;

// Bare `Nvw` tokens (not calc()) so Next's srcset builder can see the smallest ratio and
// stop emitting a 3840w `src`. Column counts mirror random-grid.css (2 / 3 / 4 / 5).
// 40vw on a phone is the cell minus `p-8`, rounded up so the file is never upscaled.
const HERO_IMAGE_SIZES =
  "(min-width: 2560px) 448px, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 40vw";

// A 3:4 portrait in a wide landscape cell is bound by height, not width. The fallback still
// contains a bare `40vw` so Next can size the srcset; phones in portrait use that fallback.
const HERO_PORTRAIT_SIZES = `(orientation: landscape) calc((100vh - 4rem) / 4 - 3rem), ${HERO_IMAGE_SIZES}`;

const getLoadingProps = (
  index: number,
): Pick<ImageProps, "preload" | "fetchPriority"> => {
  if (index === 0) return { preload: true };
  if (index < ALWAYS_VISIBLE_CELLS) return { fetchPriority: "low" };
  return {};
};

// Client-only so the grid can hold on to the first pick: the server shuffles again on every render
// of this page (a router refresh, a server action that revalidates, …), and swapping the grid then
// remounted every cell and blanked the images until the new files loaded. `useState` keeps the
// list from the initial HTML and ignores later props; a full page load still gets a new shuffle.
export const RandomGridItems = ({
  media,
  className,
}: {
  media: RandomGridMediaItem[];
  className?: string;
}) => {
  const [pinnedMedia] = useState(media);

  return (
    <div
      className={cn("random-grid-container h-full min-h-0 w-full", className)}
    >
      {pinnedMedia.map((mediaItem, index) => (
        <div
          key={`${mediaItem.url}-${index}`}
          className="random-grid-item relative h-full min-h-0 w-full overflow-hidden"
        >
          <Image
            src={mediaItem.url}
            alt=""
            fill
            sizes={
              mediaItem.isPortrait ? HERO_PORTRAIT_SIZES : HERO_IMAGE_SIZES
            }
            // Sits under the blur layers in hero-section-v2.tsx, so the extra detail of the
            // site-wide q90 is never seen. 50 is allow-listed in next.config.ts for this.
            quality={50}
            className="object-contain p-8"
            {...getLoadingProps(index)}
          />
        </div>
      ))}
    </div>
  );
};
