import type { Service } from "@repo/common-lib/types/service";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type ServiceCardProps = {
  service: Service;
  username: string;
  isAtelier?: boolean;
  titleAs?: "h2" | "h3";
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

export function ServiceCard({
  service,
  username,
  isAtelier,
  titleAs: TitleTag = "h2",
}: ServiceCardProps) {
  const { title, thumbnail, description, show_price, price } = service;
  const href = serviceHref(service, username, isAtelier);
  const isBlocked = Boolean(service.blocked_at && isAtelier);

  return (
    <Link
      href={href}
      className={`group flex h-22 flex-row phone-lg:h-full phone-lg:flex-col overflow-hidden border border-border/40 transition-colors duration-300 hover:border-border ${isBlocked ? "opacity-60" : ""}`}
    >
      <div className="relative w-24 shrink-0 phone-lg:w-full phone-lg:aspect-3/2 overflow-hidden bg-fg-1">
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
            sizes="(max-width: 480px) 96px, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-fg-1">
            <span
              aria-hidden="true"
              className="font-serif text-4xl italic text-text-muted/20"
            >
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 p-3 phone-lg:justify-start phone-lg:gap-2 phone-lg:p-4 tablet:p-5">
        <div className="flex items-start justify-between gap-3">
          <TitleTag className="line-clamp-1 text-sm font-medium tracking-tight phone-lg:text-base tablet:text-lg">
            {title}
          </TitleTag>
          <ArrowUpRight
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </div>

        {description ? (
          <p className="hidden phone-lg:line-clamp-1 text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        ) : null}

        {show_price && price != null ? (
          <span className="phone-lg:mt-auto pt-0.5 phone-lg:pt-2 text-sm font-serif italic text-text-muted">
            ${price.toFixed(2)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
