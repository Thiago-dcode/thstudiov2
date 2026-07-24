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
    document.getElementById(href.slice(1))?.scrollIntoView({
      behavior: "smooth",
    });
    onClick?.(event);
  };

  return <a href={href} onClick={handleClick} {...props} />;
}
