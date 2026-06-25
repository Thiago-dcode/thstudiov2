import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"


const badgeVariants = cva(
 "inline-flex items-center border px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
 {
 variants: {
 variant: {
 default:
 "border-border bg-text text-bg hover:bg-text-muted shadow hover:bg-text/80",
 secondary:
 "border-border border bg-bg-fg text-text hover:bg-fg",
 destructive:
 "border-border bg-error text-error-fg shadow hover:bg-error/90",
 outline: "text-text",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

export interface BadgeProps
 extends React.HTMLAttributes<HTMLDivElement>,
 VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
 return (
 <div className={cn(badgeVariants({ variant }), className)} {...props} />
 )
}

export { Badge, badgeVariants }
