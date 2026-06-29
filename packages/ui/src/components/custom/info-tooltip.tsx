"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "../shadcn/popover"
import { Info } from "lucide-react"
import { cn } from "../../lib/utils"

const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)"

type InfoTooltipProps = {
 content: ReactNode
 iconClassName?: string
 openDelay?: number
}

export const InfoTooltip = ({
 content,
 iconClassName,
 openDelay = 200,
}: InfoTooltipProps) => {
 const [open, setOpen] = useState(false)
 const [hoverCapable, setHoverCapable] = useState(false)
 const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
 const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

 useEffect(() => {
 const mq = window.matchMedia(HOVER_CAPABLE_QUERY)
 const update = () => setHoverCapable(mq.matches)
 update()
 mq.addEventListener("change", update)
 return () => mq.removeEventListener("change", update)
 }, [])

 useEffect(() => {
 return () => {
 if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)
 if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
 }
 }, [])

 const clearTimers = () => {
 if (openTimeoutRef.current) {
 clearTimeout(openTimeoutRef.current)
 openTimeoutRef.current = null
 }
 if (closeTimeoutRef.current) {
 clearTimeout(closeTimeoutRef.current)
 closeTimeoutRef.current = null
 }
 }

 const scheduleOpen = () => {
 if (!hoverCapable) return
 clearTimers()
 openTimeoutRef.current = setTimeout(() => setOpen(true), openDelay)
 }

 const scheduleClose = () => {
 if (!hoverCapable) return
 clearTimers()
 closeTimeoutRef.current = setTimeout(() => setOpen(false), 120)
 }

 const keepOpen = () => {
 if (!hoverCapable) return
 clearTimers()
 setOpen(true)
 }

 return (
 <Popover
 open={open}
 onOpenChange={(next) => {
 clearTimers()
 setOpen(next)
 }}
 >
 <PopoverTrigger asChild>
 <button
 type="button"
 aria-label="More information"
 aria-expanded={open}
 className={cn(
 "inline-flex shrink-0 items-center justify-center",
 "size-8 -m-1.5 text-text-muted",
 "cursor-help hover:text-text",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-em",
 )}
 onMouseEnter={scheduleOpen}
 onMouseLeave={scheduleClose}
 >
 <Info className={cn("size-5", iconClassName)} aria-hidden />
 </button>
 </PopoverTrigger>
 <PopoverContent
 className="w-64"
 onMouseEnter={keepOpen}
 onMouseLeave={scheduleClose}
 onOpenAutoFocus={(e) => e.preventDefault()}
 >
 <div className="text-sm leading-relaxed text-text-muted">{content}</div>
 </PopoverContent>
 </Popover>
 )
}
