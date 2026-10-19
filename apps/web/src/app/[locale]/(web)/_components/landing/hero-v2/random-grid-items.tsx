"use client";

import { cn } from "@repo/ui/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export type RandomGridMediaItem = {
  url: string;
  isPortrait: boolean;
};

// Cells 1–6 are on screen at every breakpoint (2 columns × 3 rows is the smallest layout), so
// they must not wait for lazy loading; cells 7+ are hidden by CSS on smaller screens and stay lazy
// so a phone never downloads them. The first cell is preloaded; the next two get a high fetch
// priority so the first row arrives together. (`preload` and `fetchPriority` are not combined —
// Next's docs advise against it.)
const ALWAYS_VISIBLE_CELLS = 6;
const HIGH_PRIORITY_CELLS = 3;

// `p-8` on each image is 2rem per side, so the file is drawn 4rem narrower than its cell. Column
// counts mirror random-grid.css (2 / 3 / 4 / 5 at 0 / 768 / 1280 / 2560px). At 2560px+ the
// container is capped at 2560px, so each of the 5 cells is 512px wide: 512 - 64 = 448px.
const HERO_IMAGE_SIZES =
  "(min-width: 2560px) 448px, (min-width: 1280px) calc(25vw - 4rem), (min-width: 768px) calc(33.34vw - 4rem), calc(50vw - 4rem)";

// A 3:4 portrait in a wide cell is bound by the cell's HEIGHT, not its width: on a 1350×940
// desktop it is drawn ~171px wide, yet the width-based sizes above fetched the 384px file. The
// hero is 100svh - 4rem tall with 3 rows and `p-8`, so the drawn height is
// (100vh - 4rem) / 3 - 4rem and the width is 3/4 of that: (100vh - 4rem) / 4 - 3rem. It can only
// overshoot the drawn width (vh >= svh, and the width bound may be the smaller one), never
// undershoot it, so the file is never upscaled. Phones in portrait stay on the width-based sizes,
// where the column width is the tighter bound.
const HERO_PORTRAIT_SIZES = `(orientation: landscape) calc((100vh - 4rem) / 4 - 3rem), ${HERO_IMAGE_SIZES}`;

const getLoadingProps = (
  index: number,
): Pick<ImageProps, "preload" | "loading" | "fetchPriority"> => {
  if (index === 0) return { preload: true };
  if (index >= ALWAYS_VISIBLE_CELLS) return {};
  return {
    loading: "eager",
    ...(index < HIGH_PRIORITY_CELLS && { fetchPriority: "high" as const }),
  };
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
