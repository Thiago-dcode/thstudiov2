import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

type StickyFormFooterProps = {
  children: ReactNode;
  className?: string;
  /** Optional content above the main footer row (e.g. step progress). */
  top?: ReactNode;
};

export function StickyFormFooter({
  children,
  className,
  top,
}: StickyFormFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-bg px-4 py-3 sm:-mx-6 sm:mt-10 sm:px-6 sm:py-4",
        className,
      )}
    >
      {top}
      {children}
    </div>
  );
}
