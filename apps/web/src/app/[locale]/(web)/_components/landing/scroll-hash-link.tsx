"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";

type ScrollHashLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: `#${string}`;
};

/**
 * In-page scroll link that does not push a hash onto the history stack.
 * Plain `href="#id"` creates an extra history entry; Next.js App Router often
 * fails to remount the previous page when the browser back button returns to
 * that hash URL from another route.
 */
export function ScrollHashLink({
  href,
  onClick,
  ...props
}: ScrollHashLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    // A section with nothing to show renders nothing, so its anchor can be missing: fall back to
    // the next section that did render after the one holding this link.
    let target: Element | null = document.getElementById(href.slice(1));
    if (!target) {
      target =
        event.currentTarget.closest("section")?.nextElementSibling ?? null;
      while (target && target.tagName !== "SECTION") {
        target = target.nextElementSibling;
      }
    }
    target?.scrollIntoView({ behavior: "smooth" });
    onClick?.(event);
  };

  return <a href={href} onClick={handleClick} {...props} />;
}
