import type { Portfolio } from "@repo/common-lib/types/portfolio";
import { cn } from "@repo/ui/lib/utils";
import NextImage from "next/image";
import type { ReactNode } from "react";

const DEFAULT_SIZES = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

type RootProps = {
  children: ReactNode;
  className?: string;
};

function Root({ children, className }: RootProps) {
  return (
    <article className={cn("group flex w-full flex-col", className)}>
      {children}
    </article>
  );
}

type ImageProps = {
  src?: string | null;
  alt: string;
  sizes?: string;
  isBlocked?: boolean;
  className?: string;
};

function Image({
  src,
  alt,
  sizes = DEFAULT_SIZES,
  isBlocked,
  className,
}: ImageProps) {
  const hasThumbnail = Boolean(src?.trim());

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-fg",
        isBlocked && "opacity-60",
        className,
      )}
    >
      <div className="relative aspect-[1240/1667] w-full overflow-hidden">
        {hasThumbnail ? (
          <NextImage
            src={src!}
            alt={alt}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            sizes={sizes}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-fg">
            <span
              aria-hidden="true"
              className="font-serif text-5xl text-text-muted/30"
            >
              {alt.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {isBlocked ? <BlockedBadge /> : null}
    </div>
  );
}

function BlockedBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute left-2 top-2 z-10 bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white",
        className,
      )}
    >
      Blocked
    </div>
  );
}

type DetailsProps = {
  children: ReactNode;
  className?: string;
};

function Details({ children, className }: DetailsProps) {
  return (
    <div className={cn("mt-2.5 flex flex-col gap-1 tablet:mt-3", className)}>
      {children}
    </div>
  );
}

type MetaProps = {
  children: ReactNode;
  className?: string;
};

function Meta({ children, className }: MetaProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline text-xs leading-relaxed text-text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

type MetaItemProps = {
  children: ReactNode;
  separator?: boolean;
  className?: string;
};

function MetaItem({ children, separator, className }: MetaItemProps) {
  return (
    <p className={cn("inline", className)}>
      {children}
      {separator ? (
        <span aria-hidden="true" className="text-text-muted">
          ,&nbsp;
        </span>
      ) : null}
    </p>
  );
}

type TitleProps = {
  children: ReactNode;
  className?: string;
};

function Title({ children, className }: TitleProps) {
  return (
    <h3
      className={cn(
        "text-sm! line-clamp-1 leading-snug tracking-tight text-text transition-colors duration-300 group-hover:text-text-muted",
        className,
      )}
    >
      {children}
    </h3>
  );
}

type DescriptionProps = {
  children: ReactNode;
  className?: string;
};

function Description({ children, className }: DescriptionProps) {
  return (
    <p
      className={cn(
        "line-clamp-2 text-xs! leading-relaxed text-text-muted transition-colors duration-300 group-hover:text-text-muted/80",
        className,
      )}
    >
      {children}
    </p>
  );
}

export type PortfolioCardItemProps = {
  portfolio: Portfolio;
  isAtelier?: boolean;
  sizes?: string;
  className?: string;
};

function Item({
  portfolio,
  isAtelier,
  sizes = DEFAULT_SIZES,
  className,
}: PortfolioCardItemProps) {
  const { title, thumbnail, description } = portfolio;
  const isBlocked = Boolean(portfolio.blocked_at && isAtelier);

  return (
    <Root className={className}>
      <Image src={thumbnail} alt={title} sizes={sizes} isBlocked={isBlocked} />
      <Details>
        <Title>{title}</Title>
        {description ? <Description>{description}</Description> : null}
      </Details>
    </Root>
  );
}

export const PortfolioCard = Object.assign(Root, {
  Image,
  BlockedBadge,
  Details,
  Meta,
  MetaItem,
  Title,
  Description,
  Item,
});
