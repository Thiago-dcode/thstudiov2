import Image from "next/image"
import { cn } from "../../lib/utils"

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
}

/** Intrinsic size of both PNGs. Declared so the browser reserves the box and the logo — which is
 *  in the header and footer of every page — cannot contribute layout shift (CLS). */
const LOGO_WIDTH = 401
const LOGO_HEIGHT = 366

// Drawn at h-8 / h-10 (32px / 40px tall). Width follows the 401×366 artwork:
// ~35px on phones, ~44px from tablet up. Without this, next/image treats the
// intrinsic 401px as the layout width and fetches the 640/828 2× files.
const LOGO_SIZES = "(min-width: 768px) 44px, 35px"

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
    ? "h-full w-auto"
    : "h-full w-auto"

  return (
    <span
      className={cn(
        "inline-flex h-8 tablet:h-10 w-auto items-center overflow-hidden select-none",
        className
      )}
    >
      {/* Dark artwork for light theme. No preload: the mark is not the LCP
          element and must not lead the document. `sizes` keeps the file at
          the drawn width instead of 2× the 401px intrinsic size. */}
      <Image
        src="/logo/logo_black.png"
        alt="A11 STUDIO"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes={LOGO_SIZES}
        className={cn(imgClass, "dark:hidden")}
      />
      {/* White artwork for dark theme — hidden on the default light page, so it
          must not emit a preload. */}
      <Image
        src="/logo/logo_white.png"
        alt=""
        aria-hidden
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes={LOGO_SIZES}
        className={cn(imgClass, "hidden dark:block")}
      />
    </span>
  )
}
