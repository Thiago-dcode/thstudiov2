'use client'

import { Media } from "@repo/common-lib/types/media";
import { MediaCard } from "./media-card";

type MediaGridProps = {
  media: Media[];
  username: string;
};

export function MediaGrid({ media, username }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {media.map((item) => (
        <MediaCard key={item.id} media={item} username={username} />
      ))}
    </div>
  );
}

