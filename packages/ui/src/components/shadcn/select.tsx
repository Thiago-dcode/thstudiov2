import * as React from "react"

import { cn } from "../../lib/utils"
import { inputBaseClassName } from "./input-styles"

/**
 * Native select styled like Input. Override `className` for size/layout only.
 */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        inputBaseClassName,
        "flex h-11 w-full appearance-none px-3.5 text-base sm:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Select.displayName = "Select"

export { Select }
