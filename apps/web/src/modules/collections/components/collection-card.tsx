import type { Collection } from "@repo/common-lib/types/collection";
import { cn } from "@repo/ui/lib/utils";

export type CollectionCardProps = {
  collection: Collection;
  isAtelier?: boolean;
  className?:string
};




export const CollectionCard = ({
  collection,
  isAtelier,
  className
}: CollectionCardProps) => {
  const images =collection.media
  .slice()
  .sort((a, b) => a.position - b.position)
  .map((m) => m.thumbnail)
  .filter((t): t is string => Boolean(t))
  .slice(0, 3);

  const title = collection.title;
  const isBlocked = Boolean(collection.blocked_at && isAtelier);

return (
    <article className={cn(`group cursor-pointer aspect-square relative ${isBlocked ? "opacity-60" : ""}`,className)}>
      {isBlocked ? (
        <div className="absolute left-2 top-2 z-30 rounded-sm bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          Blocked
        </div>
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        {images.length === 0 ? (
          <div className="absolute w-[78%] h-[78%] rounded-md overflow-hidden  shadow-md bg-fg-2 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full" />
          </div>
        ) : (
          images.slice().reverse().map((image, revIdx) => {
            const i = images.length - 1 - revIdx;

            if (i === 0) {
              return (
                <div
                  key={i}
                  className="absolute w-[78%] h-[78%] rounded-md overflow-hidden  shadow-md bg-fg-2 group-hover:scale-105 transition-transform duration-200 z-10"
                >
                  {image ? (
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              );
            }

            const rotation = i % 2 === 0 ? i * 3 : -(i * 3);
            const tx = i % 2 === 0 ? i * 2 : -(i * 2);
            const ty = i % 2 === 0 ? -(i * 2) : i * 2;

            return (
              <div
                key={i}
                className="absolute w-[78%] h-[78%] rounded-md overflow-hidden shadow-sm bg-fg-2"
                style={{
                  transform: `rotate(${rotation}deg) translate(${tx}px, ${ty}px)`,
                }}
              >
                {image && (
                  <img src={image} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            );
          })
        )}
      </div>
      {title ? (
        <div className="absolute inset-x-[12%] bottom-[12%] z-20 pointer-events-none min-w-0">
          <h3 className="w-full min-w-0 truncate text-xs text-bg/90 font-semibold text-text bg-text/50 px-2 py-1 shadow-md pointer-events-auto">
            {title}
          </h3>
        </div>
      ) : null}
    </article>
  );
};
