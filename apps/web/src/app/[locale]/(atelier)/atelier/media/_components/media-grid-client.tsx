"use client";

import type { Media } from "@repo/common-lib/types/media";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import dynamic from "next/dynamic";

function MediaGridSkeleton() {
 return (
 <div className="flex flex-col w-full gap-2">
 <div className="flex justify-end">
 <Skeleton className="h-9 w-28" />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
 {Array.from({ length: 12 }).map((_, i) => (
 <div key={`skeleton-${i}`} className="flex flex-col gap-2">
 <Skeleton className="aspect-square w-full" />
 <Skeleton className="h-3 w-3/4 rounded" />
 </div>
 ))}
 </div>
 </div>
 );
}

// Dynamic import with SSR disabled to prevent hydration mismatch
// Radix UI Drawer generates random IDs that differ between server/client
const MediaGrid = dynamic(
 () => import("./media-grid").then((mod) => mod.MediaGrid),
 {
 ssr: false,
 loading: () => <MediaGridSkeleton />,
 },
);

type MediaGridClientProps = {
 media: Media[];
 username: string;
};

export function MediaGridClient({ media, username }: MediaGridClientProps) {
 return <MediaGrid media={media} username={username} />;
}
