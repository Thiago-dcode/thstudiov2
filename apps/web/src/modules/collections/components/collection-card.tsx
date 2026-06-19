import type { Collection } from "@repo/common-lib/types/collection";
import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";

export type CollectionCardProps = {
  collection: Collection;
  isAtelier?: boolean;
  className?: string;
};

export const CollectionCard = ({
  collection,
  isAtelier,
  className,
}: CollectionCardProps) => {
  const images = collection.media
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((m) => m.thumbnail)
    .filter((t): t is string => Boolean(t))
    .slice(0, 3);

  const title = collection.title;
  const isBlocked = Boolean(collection.blocked_at && isAtelier);

  return (
    <article
      className={cn(
        `group relative aspect-square cursor-pointer ${isBlocked ? "opacity-60" : ""}`,
        className,
      )}
    >
      {isBlocked ? (
        <div className="absolute left-2 top-2 z-30 bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          Blocked
        </div>
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        {images.length === 0 ? (
          <div className="absolute h-[78%] w-[78%] overflow-hidden bg-fg-2 shadow-md transition-transform duration-200 group-hover:scale-105">
            <div className="h-full w-full" />
          </div>
        ) : (
          images
            .slice()
            .reverse()
            .map((image, revIdx) => {
              const i = images.length - 1 - revIdx;

              if (i === 0) {
                return (
                  <div
                    key={i}
                    className="absolute z-10 h-[78%] w-[78%] overflow-hidden bg-fg-2 shadow-md transition-transform duration-200 group-hover:scale-105"
                  >
                    <Image
                      src={image}
                      alt={title || "Collection cover"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                );
              }

              const rotation = i % 2 === 0 ? i * 3 : -(i * 3);
              const tx = i % 2 === 0 ? i * 2 : -(i * 2);
              const ty = i % 2 === 0 ? -(i * 2) : i * 2;

              return (
                <div
                  key={i}
                  className="absolute h-[78%] w-[78%] overflow-hidden bg-fg-2 shadow-sm"
                  style={{
                    transform: `rotate(${rotation}deg) translate(${tx}px, ${ty}px)`,
                  }}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              );
            })
        )}
      </div>
      {title ? (
        <div className="pointer-events-none absolute inset-x-[12%] bottom-[12%] z-20 min-w-0">
          <h3 className="pointer-events-auto w-full min-w-0 truncate bg-text/50 px-2 py-1 text-xs font-semibold text-bg/90 shadow-md">
            {title}
          </h3>
        </div>
      ) : null}
    </article>
  );
};
