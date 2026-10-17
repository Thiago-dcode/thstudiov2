import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";
import "./random-grid.css";

import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";

type MediaItem = {
  url: string;
};

const MEDIA_SHAPES = ENUMS.MEDIA_SHAPE.filter((m) => m !== "SQUARE");

//total stored on amazon s3
//must be checked and ensure them exist manually
const TOTAL_PORTRAIT_MEDIA = 15;
const TOTAL_LANDSCAPE_MEDIA = 16;

const buildMediaItem = (
  shape: EnumType<"MEDIA_SHAPE">,
  index: number,
): MediaItem => {
  const shapeLower = shape.toLowerCase();
  return {
    url: `https://cdn.a11studio.com/public/${shapeLower}/${shapeLower}-${index}.webp`,
  };
};
const buildMediaItemArr = (shape: EnumType<"MEDIA_SHAPE">, length: number) => {
  return Array.from({
    length,
  }).map((_, i) => buildMediaItem(shape, i + 1));
};
const initialMedia: Record<EnumType<"MEDIA_SHAPE">, MediaItem[]> = {
  PORTRAIT: buildMediaItemArr("PORTRAIT", TOTAL_PORTRAIT_MEDIA),
  LANDSCAPE: buildMediaItemArr("LANDSCAPE", TOTAL_LANDSCAPE_MEDIA),
  SQUARE: [],
};

const restoreMediaShapeAvailable = () => {
  return [...MEDIA_SHAPES];
};

const resolvedMediaToPick = (itemsLength: number): MediaItem[] => {
  // Per-request copies: splicing them never touches the module-level initialMedia.
  const mediaPool: Record<EnumType<"MEDIA_SHAPE">, MediaItem[]> = {
    PORTRAIT: [...initialMedia.PORTRAIT],
    LANDSCAPE: [...initialMedia.LANDSCAPE],
    SQUARE: [...initialMedia.SQUARE],
  };
  let mediaShapeAvailable = restoreMediaShapeAvailable();

  const getNextMedia = () => {
    if (mediaShapeAvailable.length === 0) {
      mediaShapeAvailable = restoreMediaShapeAvailable();
    }

    const shapeIndex = Math.floor(Math.random() * mediaShapeAvailable.length);
    const shapeSelected = mediaShapeAvailable[shapeIndex];
    mediaShapeAvailable.splice(shapeIndex, 1);

    if (mediaPool[shapeSelected].length === 0) {
      mediaPool[shapeSelected] = [...initialMedia[shapeSelected]];
    }

    const mediaGroupSelected = mediaPool[shapeSelected];
    const mediaIndex = Math.floor(Math.random() * mediaGroupSelected.length);

    return mediaGroupSelected.splice(mediaIndex, 1)[0];
  };

  const mediaToPickResolved: MediaItem[] = [];

  for (let i = 0; i < itemsLength; i++) {
    mediaToPickResolved.push(getNextMedia());
  }

  return mediaToPickResolved;
};

// Columns per breakpoint live in random-grid.css; this is the widest layout (ultrawide)
// so the server always picks enough media and CSS hides the cells a smaller screen can't fit.
const MAX_COLS = 5;
const ROWS = 3;

export const RandomGrid = ({ className }: { className?: string }) => {
  const resolvedMedia = resolvedMediaToPick(MAX_COLS * ROWS);

  return (
    <div
      className={cn("random-grid-container h-full min-h-0 w-full", className)}
    >
      {resolvedMedia.map((mediaItem, index) => (
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
