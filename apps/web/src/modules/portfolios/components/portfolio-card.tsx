import type { Portfolio } from "@repo/common-lib/types/portfolio";
import { cn } from "@repo/ui/lib/utils";
import Image from "next/image";

export type PortfolioCardProps = {
  portfolio: Portfolio;
  isAtelier?: boolean;
  sizes?: string;
  className?: string;
};

export function PortfolioCard({
  portfolio,
  isAtelier,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className,
}: PortfolioCardProps) {
  const { title, thumbnail, description } = portfolio;
  const hasThumbnail = Boolean(thumbnail?.trim());
  const isBlocked = Boolean(portfolio.blocked_at && isAtelier);

  return (
    <article
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-sm",
        className,
      )}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-fg-1 ${isBlocked ? "opacity-60" : ""}`}
      >
        {hasThumbnail ? (
          <>
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes={sizes}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-fg-1">
            <span
              aria-hidden="true"
              className="font-serif text-5xl italic text-text-muted/30"
            >
              {title.charAt(0)}
            </span>
          </div>
        )}

        {isBlocked ? (
          <div className="absolute left-2 top-2 z-10 rounded-sm bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            Blocked
          </div>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
          <h3 className="text-sm italic tracking-tight text-white drop-shadow-md md:text-base">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-white/70">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-white/10 transition-all duration-500 group-hover:ring-white/20" />
    </article>
  );
}
