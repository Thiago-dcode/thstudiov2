import { cn } from "@repo/ui/lib/utils";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ScrollHashLink } from "./scroll-hash-link";

/**
 * One screen below the fixed header (`h-20` + `main`'s `pt-20`): a section this tall fills exactly
 * what is visible once the arrows scroll it to the top.
 */
export const FULL_SCREEN_MIN_H = "min-h-[calc(100svh-5rem)]";
/** Exactly one screen, for sections whose content would otherwise grow them (the hero's grid). */
export const FULL_SCREEN_H = "h-[calc(100svh-5rem)]";

function Root({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    // scroll-mt-20: in-page scrolls stop below the fixed header, on the section's first pixel.
    <section id={id} className={cn("relative scroll-mt-20", className)}>
      {children}
    </section>
  );
}

function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-(--breakpoint-ultrawide) px-2 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Header({
  badge,
  title,
  description,
  className,
  descriptionClassName,
}: {
  badge: string;
  title: string;
  description: string;
  className?: string;
  descriptionClassName?: string;
}) {
  return (
    <header
      className={cn(
        "mb-12 flex flex-col items-center gap-4 text-center",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
          {badge}
        </span>
        <h2 className="text-2xl font-bold leading-tight tracking-tight tablet:text-3xl laptop:text-[2.75rem]">
          {title}
        </h2>
      </div>
      <p
        className={cn(
          "max-w-lg text-base leading-relaxed text-text-muted tablet:text-lg",
          descriptionClassName,
        )}
      >
        {description}
      </p>
    </header>
  );
}

function ActionLink({
  href,
  children,
  className,
  iconClassName,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-base font-medium tracking-wider transition-colors text-text hover:text-text-muted",
        className,
      )}
    >
      {children}
      <ArrowRight
        className={cn(
          "size-3.5 transition-transform group-hover:translate-x-0.5",
          iconClassName,
        )}
      />
    </Link>
  );
}

function NextSectionLink({
  href,
  ariaLabel,
  className,
}: {
  href: `#${string}`;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <>
      <ScrollHashLink
        href={href}
        aria-label={ariaLabel}
        className={cn(
          "hidden phone-xs:block  z-100 absolute bottom-6 left-1/2 -translate-x-1/2 p-3 text-text-muted/50 transition-colors hover:text-text focus-visible:text-text",
          className,
        )}
      >
        <ChevronDown
          className="size-5 next-section-bounce text-text-muted"
          aria-hidden="true"
        />
      </ScrollHashLink>
      <style>{`
@media (prefers-reduced-motion: no-preference) {
  .next-section-bounce {
    animation: next-section-float 2.4s ease-in-out infinite;
  }
  @keyframes next-section-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(5px); }
  }
}
`}</style>
    </>
  );
}

/**
 * Props every homepage section receives from the page's `SECTIONS` list: its own anchor id and the
 * id of the section after it, so "scroll to next" links follow the list order instead of a
 * hard-coded anchor that goes stale when sections are reordered.
 */
export type LandingSectionProps = {
  id: string;
  nextSectionId?: string;
};

export const WebSection = Object.assign(Root, {
  Container,
  Header,
  ActionLink,
  NextSectionLink,
});
