import type { Service } from "@repo/common-lib/types/service";
import { cn } from "@repo/ui/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CardDescription, CardTitle } from "@/lib/components/card-text";

export type ServiceCardProps = {
  service: Service;
  username: string;
  isAtelier?: boolean;
};

function serviceHref(
  service: Service,
  username: string,
  isAtelier: boolean | undefined,
) {
  if (isAtelier) {
    return `/atelier/services/edit/${service.slug}`;
  }
  return `/artists/${username}/services/${service.slug}`;
}

type ServiceCardThumbnailProps = {
  title: string;
  thumbnail: string | null | undefined;
  isBlocked: boolean;
  variant: "column" | "row";
};

function ServiceCardThumbnail({
  title,
  thumbnail,
  isBlocked,
  variant,
}: ServiceCardThumbnailProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-fg",
        variant === "column" ? "w-full aspect-3/2" : "w-24 shrink-0",
      )}
    >
      {isBlocked ? (
        <div className="absolute left-2 top-2 z-10 bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          Blocked
        </div>
      ) : null}
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes={
            variant === "column"
              ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              : "96px"
          }
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-fg">
          <span
            aria-hidden="true"
            className="font-serif text-4xl text-text-muted/20"
          >
            {title.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
}

type ServiceCardBodyProps = {
  title: string;
  description: string | null | undefined;
  showPrice: boolean;
  price: number | null | undefined;
  variant: "column" | "row";
};

function ServiceCardBody({
  title,
  description,
  showPrice,
  price,
  variant,
}: ServiceCardBodyProps) {
  const isColumn = variant === "column";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isColumn
          ? "justify-start gap-2 p-4 tablet:p-5"
          : "justify-center gap-0.5 p-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <CardTitle>{title}</CardTitle>
        <ArrowUpRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>

      {isColumn && description ? (
        <CardDescription>{description}</CardDescription>
      ) : null}

      {showPrice && price != null ? (
        <span
          className={cn(
            "text-sm font-serif text-text-muted",
            isColumn ? "mt-auto pt-2" : "pt-0.5",
          )}
        >
          ${price.toFixed(2)}
        </span>
      ) : null}
    </div>
  );
}

export function ServiceCard({
  service,
  username,
  isAtelier,
}: ServiceCardProps) {
  const { title, thumbnail, description, show_price, price } = service;
  const href = serviceHref(service, username, isAtelier);
  const isBlocked = Boolean(service.blocked_at && isAtelier);

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden border border-border/40 transition-colors duration-300 hover:border-border",
        isBlocked && "opacity-60",
      )}
    >
      <ServiceCardThumbnail
        title={title}
        thumbnail={thumbnail}
        isBlocked={isBlocked}
        variant="column"
      />
      <ServiceCardBody
        title={title}
        description={description}
        showPrice={show_price}
        price={price}
        variant="column"
      />
    </Link>
  );
}

export function ServiceCardRow({
  service,
  username,
  isAtelier,
}: ServiceCardProps) {
  const { title, thumbnail, description, show_price, price } = service;
  const href = serviceHref(service, username, isAtelier);
  const isBlocked = Boolean(service.blocked_at && isAtelier);

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-22 flex-row overflow-hidden border border-border/40 transition-colors duration-300 hover:border-border",
        isBlocked && "opacity-60",
      )}
    >
      <ServiceCardThumbnail
        title={title}
        thumbnail={thumbnail}
        isBlocked={isBlocked}
        variant="row"
      />
      <ServiceCardBody
        title={title}
        description={description}
        showPrice={show_price}
        price={price}
        variant="row"
      />
    </Link>
  );
}
