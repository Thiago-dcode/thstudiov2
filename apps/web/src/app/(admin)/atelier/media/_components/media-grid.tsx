'use client'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@repo/ui/components/shadcn/dialog";
import Image from "next/image";
import { Media } from "@repo/common-lib/types/media";

type MediaGridProps = {
  media: Media[];
  username: string;
};

export function MediaGrid({ media, username }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {media.map((item) => (
        <Dialog key={item.id}>
          <DialogTrigger>
            <article className="relative aspect-square rounded-lg overflow-hidden bg-fg-1 group">
              {item.thumbnail ? (
                <Image
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  alt={item.seo_alt || `${username} media`}
                  src={item.thumbnail}
                />
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
                  No preview
                </div>
              )}
            </article>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{item.title || 'Media Preview'}</DialogTitle>
            <p>{item.title}</p>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}

