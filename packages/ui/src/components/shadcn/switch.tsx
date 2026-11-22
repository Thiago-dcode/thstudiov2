"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "../../lib/utils"

type SwitchProps = Omit<
 React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
 "className"
> & { className?: string }

/**
 * Square on/off control. Pass an accessible name with `aria-labelledby` (a visible label) or
 * `aria-label`. Domain-free: the caller owns the label, the copy and the state.
 */
const Switch = ({ className, ...props }: SwitchProps) => (
 <SwitchPrimitive.Root
 className={cn(
    "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border border-border bg-fg-2 p-0.5 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-em data-[checked]:bg-text data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
 className
 )}
 {...props}
 >
 <SwitchPrimitive.Thumb className="block h-4 w-4 bg-bg shadow transition-transform motion-reduce:transition-none data-[checked]:translate-x-5" />
 </SwitchPrimitive.Root>
)
Switch.displayName = "Switch"

export { Switch }
