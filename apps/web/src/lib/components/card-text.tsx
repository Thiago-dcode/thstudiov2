import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A card's title. `h3`, not `h4`: cards sit directly under a page's `h1` (list pages) or a section's
 * `h2` (profile, directory), so `h4` skipped a level in every outline. `font-sans!` keeps the body
 * font the `h4` had — the global `h3` style would otherwise switch it to the brand serif.
 */
export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "line-clamp-1 font-sans! text-lg! font-bold! leading-snug tracking-tight text-text transition-colors duration-300 group-hover:text-text-muted",
        className,
      )}
    >
      {children}
    </h3>
  );
}

type CardDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p
      className={cn(
        "line-clamp-2 text-sm! font-normal leading-relaxed text-text-muted transition-colors duration-300 group-hover:text-text-muted/80",
        className,
      )}
    >
      {children}
    </p>
  );
}
