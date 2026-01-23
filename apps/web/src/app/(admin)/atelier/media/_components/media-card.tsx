'use client'

import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@repo/ui/components/shadcn/drawer";
import { Media } from "@repo/common-lib/types/media";
import { format } from "date-fns";

type MediaCardProps = {
  media: Media;
  username: string;
};

export function MediaCard({ media, username }: MediaCardProps) {
  // Format date - use updated_at if available, otherwise fallback to created_at
  const getFormattedDate = () => {
    const mediaItem = media as any;
    const dateValue = mediaItem.updated_at || mediaItem.created_at;
    if (!dateValue) return null;
    try {
      return format(new Date(dateValue), 'MMM d, yyyy');
    } catch {
      return null;
    }
  };
  const formattedDate = getFormattedDate();

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <article className="group cursor-pointer flex flex-col p-2">
          {/* Image Section - Floating */}
          <div className="relative aspect-square flex items-center justify-center overflow-hidden rounded-lg mb-2">
            {media.thumbnail ? (
              <img
                src={media.thumbnail}
                alt={media.seo_alt || media.title || `${username} media`}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="flex items-center justify-center text-muted-foreground text-xs bg-fg-2 rounded-lg w-full h-full">
                No preview
              </div>
            )}
          </div>
          
          {/* Title and Date - Stacked at Bottom */}
          <div className="flex flex-col">
            <h3 className="text-xs font-medium text-foreground line-clamp-1">
              {media.title || media.seo_filename || 'Untitled'}
            </h3>
            {formattedDate && (
              <p className="text-[10px] text-muted-foreground">
                {formattedDate}
              </p>
            )}
          </div>
        </article>
      </DrawerTrigger>
      <DrawerContent className="h-full max-w-80">
        <DrawerTitle className="px-4 pt-4 pb-2">
          {media.title || media.seo_filename || 'Media Preview'}
        </DrawerTitle>
        <div className="px-4 pb-4 space-y-2">
          {media.description && (
            <p className="text-sm text-muted-foreground">{media.description}</p>
          )}
          {formattedDate && (
            <p className="text-xs text-muted-foreground">Updated: {formattedDate}</p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

