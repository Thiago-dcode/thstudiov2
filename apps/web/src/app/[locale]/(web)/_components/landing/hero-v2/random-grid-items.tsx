"use client";

import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";
import { useState } from "react";

export type RandomGridMediaItem = {
  url: string;
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
            sizes="(min-width: 2560px) 512px, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-8"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
};
