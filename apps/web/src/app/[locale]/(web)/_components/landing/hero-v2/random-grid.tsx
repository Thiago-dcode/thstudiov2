import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import { RandomGridItems, type RandomGridMediaItem } from "./random-grid-items";
import "./random-grid.css";

type MediaItem = RandomGridMediaItem;

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
    isPortrait: shape === "PORTRAIT",
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
  return (
    <RandomGridItems
      media={resolvedMediaToPick(MAX_COLS * ROWS)}
      className={className}
    />
  );
};
