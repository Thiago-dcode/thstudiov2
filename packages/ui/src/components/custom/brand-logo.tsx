import { cn } from "../../lib/utils"

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
}

/**
 * A11 STUDIO logomark.
 *
 * Served from the web app's public folder as two PNGs — the dark artwork for
 * light backgrounds and the white artwork for dark backgrounds. Both are always
 * rendered and toggled with the `dark:` variant (driven by the `.dark` class the
 * theme provider sets), so the correct one shows with no client boundary or
 * hydration flash.
 *
 * `collapsed` crops to just the stacked "A11" mark (the top ~64% of the artwork)
 * for narrow containers such as the shrunk sidebar. The wrapper's height (from
 * `className`, default `h-8`) drives the size; the image is scaled to ~156% so
 * the A11 band fills that height while the "studio" wordmark is clipped away.
 */
export const BrandLogo = ({ collapsed = false, className }: BrandLogoProps) => {
  const imgClass = collapsed
    ? "h-[156%] w-auto max-w-none object-top"
    : "h-full w-auto"

  return (
    <span
      className={cn(
        "inline-flex h-8 tablet:h-10 w-auto items-start overflow-hidden select-none",
        className
      )}
    >
      {/* Dark artwork for light theme */}
      <img
        src="/logo/logo_black.png"
        alt="A11 STUDIO"
        className={cn(imgClass, "dark:hidden")}
      />
      {/* White artwork for dark theme */}
      <img
        src="/logo/logo_white.png"
        alt=""
        aria-hidden
        className={cn(imgClass, "hidden dark:block")}
      />
    </span>
  )
}
