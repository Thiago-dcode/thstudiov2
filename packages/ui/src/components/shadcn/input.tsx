import * as React from "react"

import { cn } from "../../lib/utils"
import { inputBaseClassName } from "./input-styles"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputBaseClassName,
          "flex h-11 w-full px-3.5 text-base sm:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
