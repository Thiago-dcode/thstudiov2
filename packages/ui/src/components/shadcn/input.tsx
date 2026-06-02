import * as React from "react"

import { cn } from "../../lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xs border-2 border-fg-2 bg-bg px-3 py-5 sm:text-sm text-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:border-text/80 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
