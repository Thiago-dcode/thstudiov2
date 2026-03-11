import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"


import { cn } from "../../lib/utils"
const buttonVariants = cva(
  "px-2 py-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:cursor-pointer active:scale-[0.98] text-xs",  {
    variants: {
      variant: {
        default:
          "bg-text text-bg hover:bg-text-muted",
        primary:'bg-accent text-white/90',
        base:"bg-fg-2 text-text hover:bg-fg-1",
        destructive:
          "bg-red-400 text-white/90 font-semibold shadow-sm hover:bg-red-300",
        outline:
          "border border-input bg-background  shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-fg shadow-sm hover:bg-secondary/80",
        ghost: "bg-transparent text-sm transition-colors text-text-muted hover:text-text",
        link: "text-primary underline-offset-4 hover:underline",

      },
      size: {
        default: "p-3 text-base",
        sm: "p-2 text-xs",
        lg: "p-4 md:p-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
