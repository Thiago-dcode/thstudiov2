import type { EnumType } from "@repo/common-lib/constants/enums";
import { cn } from "../../lib/utils";

/**
 * Marks what a tile's stored media actually is. Listings deliberately render the static WebP
 * poster rather than the `.gif` itself, so without this there is nothing to tell an animation
 * apart from a still.
 *
 * Public listings pass no `showForAllTypes`: badging every tile "Photo" is noise when almost
 * everything is one. The atelier is the opposite — the artist is managing a mixed library and
 * wants the type stated on every card.
 *
 * `label` carries the localized name. It falls back to the raw enum, which is already the right
 * word for `GIF` — the case that matters in `packages/ui`, where there is no translator.
 */
export function MediaTypeBadge({
  mediaType,
  label,
  showForAllTypes = false,
  className,
}: {
  mediaType?: EnumType<"MEDIA_TYPE"> | null;
  label?: string;
  showForAllTypes?: boolean;
  className?: string;
}) {
  if (!mediaType) return null;
  if (!showForAllTypes && mediaType !== "GIF") return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-2 left-2 z-10 bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide text-white/90 backdrop-blur-sm",
        className,
      )}
    >
      {label || mediaType}
    </span>
  );
}
