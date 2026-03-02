'use client'

import dynamic from "next/dynamic";
import { Media } from "@repo/common-lib/types/media";

// Dynamic import with SSR disabled to prevent hydration mismatch
// Radix UI Drawer generates random IDs that differ between server/client
const MediaGrid = dynamic(() => import("./media-grid").then(mod => mod.MediaGrid), {
    ssr: false,
});

type MediaGridClientProps = {
    media: Media[];
    username: string;
};

export function MediaGridClient({ media, username }: MediaGridClientProps) {
    return <MediaGrid media={media} username={username} />;
}

