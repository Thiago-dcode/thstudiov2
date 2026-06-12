import { cn } from "@repo/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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
    <section id={id} className={cn("relative", className)}>
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
        "relative mx-auto w-full max-w-(--screen-desktop) px-6 py-20 tablet:px-10 tablet:py-28",
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
        "mb-14 flex flex-col items-center gap-4 text-center",
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {badge}
      </span>
      <h2 className="text-2xl font-bold leading-tight tracking-tight tablet:text-3xl laptop:text-[2.75rem]">
        {title}
      </h2>
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
        "group inline-flex items-center gap-2 text-base font-medium tracking-wider transition-colors  text-text  hover:text-accent",
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

export const WebSection = Object.assign(Root, {
  Container,
  Header,
  ActionLink,
});
