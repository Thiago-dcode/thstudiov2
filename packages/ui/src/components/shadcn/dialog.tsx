"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const MOBILE_DIALOG_QUERY = "(max-width: 639px)"

function useMobileDialogViewportStyle() {
  const [style, setStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const mobileQuery = window.matchMedia(MOBILE_DIALOG_QUERY)

    const update = () => {
      if (!mobileQuery.matches) {
        setStyle({})
        return
      }

      const topOffset = Math.max(viewport.offsetTop, 0) + 16
      setStyle({
        top: `${topOffset}px`,
        maxHeight: `${Math.max(viewport.height - 32, 0)}px`,
      })
    }

    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    mobileQuery.addEventListener("change", update)
    update()

    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
      mobileQuery.removeEventListener("change", update)
    }
  }, [])

  return style
}

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Overlay>,
 React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Overlay
 ref={ref}
 className={cn(
 "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
 className
 )}
 {...props}
 />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Content>,
 React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, style, ...props }, ref) => {
 const mobileViewportStyle = useMobileDialogViewportStyle()

 return (
 <DialogPortal>
 <DialogOverlay />
 <DialogPrimitive.Content
 ref={ref}
 style={{ ...mobileViewportStyle, ...style }}
 className={cn(
 "fixed z-50 grid w-full gap-4 border bg-fg p-6 shadow-lg overflow-y-auto duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
 "left-4 right-4 top-4 w-auto max-h-[calc(100dvh-2rem)] translate-x-0 translate-y-0 max-sm:data-[state=closed]:slide-out-to-top-4 max-sm:data-[state=open]:slide-in-from-top-4",
 "sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-full sm:max-h-[calc(100dvh-4rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
 className
 )}
 {...props}
 >
 {children}
 <DialogPrimitive.Close className="absolute right-4 top-4 opacity-70 ring-offset-bg transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-fg-1 data-[state=open]:text-text">
 <X className="h-4 w-4" />
 <span className="sr-only">Close</span>
 </DialogPrimitive.Close>
 </DialogPrimitive.Content>
 </DialogPortal>
 )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn(
 "flex flex-col space-y-1.5 text-center sm:text-left",
 className
 )}
 {...props}
 />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
 className={cn(
 "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
 className
 )}
 {...props}
 />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Title>,
 React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Title
 ref={ref}
 className={cn(
 "text-lg font-semibold leading-none tracking-tight",
 className
 )}
 {...props}
 />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
 React.ElementRef<typeof DialogPrimitive.Description>,
 React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
 <DialogPrimitive.Description
 ref={ref}
 className={cn("text-sm text-text-muted", className)}
 {...props}
 />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
 Dialog,
 DialogPortal,
 DialogOverlay,
 DialogTrigger,
 DialogClose,
 DialogContent,
 DialogHeader,
 DialogFooter,
 DialogTitle,
 DialogDescription,
}
