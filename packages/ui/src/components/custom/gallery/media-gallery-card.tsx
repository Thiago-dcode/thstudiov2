"use client";

import Image from "next/image";
import { EnumType } from "@repo/common-lib/constants/enums";
import { useGallery } from "@repo/ui/providers/gallery.provider";
import type { GalleryGridMedia } from "./gallery-grid";

const toDataShape = (shape?: EnumType<'MEDIA_SHAPE'> | null) => {
 switch (shape) {
 case 'LANDSCAPE': return 'landscape';
 case 'PORTRAIT': return 'portrait';
 case 'SQUARE':
 default: return 'square';
 }
};

export function MediaGalleryCard({ 
 media, 
 index,
 gridStyle = 'mansonry-grid'
}: { 
 media: GalleryGridMedia; 
 index: number;
 gridStyle?: string;
}) {
 const { setCurrentItem } = useGallery();
 
 return (
 <button
 onClick={() => setCurrentItem(index)}
 className="cursor-pointer media-gallery-card group relative w-full overflow-hidden transition-all duration-500 ease-out hover:ring-1 hover:ring-text/20"
 data-shape={toDataShape(media.shape)}
 >
 {media.thumbnail ? (
 <div className="media-gallery-card__frame relative aspect-auto overflow-hidden w-full h-full">
 <Image
 preload={index < 5}
 unoptimized
 src={media.thumbnail}
 alt={media.seo_alt || media.title || ""}
 width={800}
 height={1000}
 className={
 gridStyle === "uniform-grid"
 ? "max-h-full max-w-full h-auto w-auto object-contain transition-transform duration-700 ease-out group-hover:scale-105"
 : "h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
 }
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 />
 </div>
 ) : (
 <div className="media-gallery-card__frame media-gallery-card__placeholder w-full h-full aspect-square flex items-center justify-center bg-fg text-xs text-text-muted ">
 void
 </div>
 )}
{/* 
 {media.title && (
 <div className={`absolute text-left z-10 transition-opacity duration-300 ${
 gridStyle === 'uniform-grid' 
 ? 'top-2 left-2 text-text-muted text-sm' 
 : 'top-4 left-4 text-white text-sm drop-shadow-md'
 }`}>
 <span className="font-medium">{media.title}</span>
 </div>
 )} */}
 </button>
 );
}
