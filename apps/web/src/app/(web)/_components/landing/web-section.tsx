import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

function Root({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("relative", className)}>{children}</section>;
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
      <h2 className="font-serif text-3xl font-medium italic tracking-tight tablet:text-4xl">
        {title}
      </h2>
      <p
        className={cn(
          "max-w-lg text-sm leading-relaxed text-text-muted tablet:text-base",
          descriptionClassName,
        )}
      >
        {description}
      </p>
    </header>
  );
}

export const WebSection = Object.assign(Root, { Container, Header });
