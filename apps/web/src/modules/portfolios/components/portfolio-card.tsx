import Image from "next/image";
import Link from "next/link";
import type { Portfolio } from "@repo/common-lib/types/portfolio";

export type PortfolioCardProps = {
  portfolio: Portfolio;
  username: string;
  isAtelier?: boolean;
  titleAs?: "h2" | "h3";
  sizes?: string;
};

function portfolioHref(portfolio: Portfolio, username: string, isAtelier: boolean | undefined) {
  if (isAtelier) {
    return `/atelier/portfolio/edit/${portfolio.slug}`;
  }
  return `/artists/${username}/portfolios/${portfolio.slug}`;
}

export function PortfolioCard({
  portfolio,
  username,
  isAtelier,
  titleAs: TitleTag = "h3",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: PortfolioCardProps) {
  const { title, thumbnail, description } = portfolio;
  const href = portfolioHref(portfolio, username, isAtelier);
  const hasThumbnail = Boolean(thumbnail?.trim());

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-sm"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-fg-1">
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
            <span className="font-serif text-3xl italic text-text-muted/30">
              {title.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
          <TitleTag className="text-sm font-serif italic tracking-tight text-white drop-shadow-md md:text-base">
            {title}
          </TitleTag>
          {description ? (
            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-white/70">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-sm transition-all duration-500 group-hover:ring-white/20" />
    </Link>
  );
}
