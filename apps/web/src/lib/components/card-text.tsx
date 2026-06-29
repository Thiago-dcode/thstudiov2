import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

type CardTitleProps = {
  children: ReactNode;
  className?: string;
};

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h4
      className={cn(
        "line-clamp-1 text-lg! font-bold! leading-snug tracking-tight text-text transition-colors duration-300 group-hover:text-text-muted",
        className,
      )}
    >
      {children}
    </h4>
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
