import * as React from "react"

import { cn } from "../../lib/utils"
import { inputBaseClassName } from "./input-styles"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        inputBaseClassName,
        "flex min-h-[7rem] w-full resize-none px-3.5 py-3 text-base sm:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
