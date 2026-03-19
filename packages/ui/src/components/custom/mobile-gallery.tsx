"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Link as LinkIcon, Share2, X } from "lucide-react"
import { useCallback, useRef } from "react"
import { useGalleryDialog } from "../../hooks/useGalleryDialog"
import { cn } from "../../lib/utils"

export const MobileGallery = () => {
    const {
        items, next, prev, setCurrentItem, currentItem,
        share, shareActive, shareSupported,
        isOpen, currentItemData, currentUrl, copied,
        handleCopyLink, handleOpenChange,
    } = useGalleryDialog()
    const touchStartX = useRef(0)
    const touchDeltaX = useRef(0)

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        touchDeltaX.current = 0
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current
    }, [])

    const handleTouchEnd = useCallback(() => {
        const SWIPE_THRESHOLD = 50
        if (touchDeltaX.current > SWIPE_THRESHOLD) prev()
        else if (touchDeltaX.current < -SWIPE_THRESHOLD) next()
        touchDeltaX.current = 0
    }, [next, prev])

    const hasActions = currentItemData?.href || currentItemData?.shared

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        "fixed inset-0 z-50 bg-black/95",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200",
                    )}
                />

                <DialogPrimitive.Content
                    className={cn(
                        "fixed inset-0 z-50 flex flex-col outline-none",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-150",
                    )}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <DialogPrimitive.Title className="sr-only">
                        Gallery
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Image {(currentItem ?? 0) + 1} of {items.length}
                    </DialogPrimitive.Description>

                    {/* Top bar: actions + close */}
                    <div className="relative z-10 flex items-center justify-between px-3 pt-[env(safe-area-inset-top,0px)] h-12 shrink-0">
                        <div className="flex items-center gap-1">
                            {hasActions && (
                                <>
                                    {currentItemData?.href && (
                                        <a
                                            href={currentItemData.href}
                                            className="p-2 text-white/60 active:text-white transition-colors duration-150 focus:outline-none"
                                            aria-label="Open media page"
                                        >
                                            <ArrowUpRight className="size-5" strokeWidth={1.5} />
                                        </a>
                                    )}
                                    {currentItemData?.shared && (
                                        <button
                                            onClick={handleCopyLink}
                                            className="p-2 text-white/60 active:text-white transition-colors duration-150 cursor-pointer focus:outline-none"
                                            aria-label={copied ? "Link copied" : "Copy media link"}
                                        >
                                            {copied
                                                ? <Check className="size-5" strokeWidth={1.5} />
                                                : <LinkIcon className="size-5" strokeWidth={1.5} />
                                            }
                                        </button>
                                    )}
                                    {shareSupported && currentItemData?.shared && (
                                        <button
                                            onClick={() => share({ url: currentItemData.shared!, title: currentItemData.title })}
                                            className="p-2 text-white/60 active:text-white transition-colors duration-150 cursor-pointer focus:outline-none"
                                            aria-label={shareActive ? "Shared" : "Share"}
                                        >
                                            {shareActive
                                                ? <Check className="size-5" strokeWidth={1.5} />
                                                : <Share2 className="size-5" strokeWidth={1.5} />
                                            }
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <DialogPrimitive.Close
                            className="p-2 text-white/60 active:text-white transition-colors duration-150 focus:outline-none"
                        >
                            <X className="size-5" strokeWidth={1.5} />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                    </div>

                    {/* Fullscreen image area */}
                    <div className="relative flex-1 flex items-center justify-center min-h-0">
                        {items.length > 1 && (
                            <button
                                onClick={prev}
                                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 text-white/25 active:text-white/70 transition-colors duration-150 cursor-pointer focus:outline-none"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="size-6" strokeWidth={1.5} />
                            </button>
                        )}

                        {currentUrl && (
                            <div className="flex flex-col items-center w-full h-full px-8">
                                {currentItemData?.title && (
                                    <p className="text-sm text-white/70 font-medium pb-2 text-center truncate max-w-full">
                                        {currentItemData.title}
                                    </p>
                                )}
                                <div className="relative flex-1 w-full min-h-0 flex items-center justify-center">
                                    <img
                                        src={currentUrl}
                                        alt={currentItemData?.alt || currentItemData?.title || ""}
                                        className="max-w-full max-h-full w-auto h-auto object-contain"
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        )}

                        {items.length > 1 && (
                            <button
                                onClick={next}
                                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 text-white/25 active:text-white/70 transition-colors duration-150 cursor-pointer focus:outline-none"
                                aria-label="Next image"
                            >
                                <ChevronRight className="size-6" strokeWidth={1.5} />
                            </button>
                        )}
                    </div>

                    {/* Dot indicators + counter */}
                    {items.length > 1 && (
                        <div className="shrink-0 flex flex-col items-center gap-2 pb-[env(safe-area-inset-bottom,8px)] pt-2">
                            {items.length <= 15 ? (
                                <div className="flex items-center gap-1.5">
                                    {items.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentItem(i)}
                                            className={cn(
                                                "cursor-pointer rounded-full transition-all duration-300 focus:outline-none",
                                                i === currentItem
                                                    ? "size-1.5 bg-white/80"
                                                    : "size-1.5 bg-white/20 active:bg-white/40",
                                            )}
                                            aria-label={`Go to image ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white/40">
                                    {(currentItem ?? 0) + 1} / {items.length}
                                </p>
                            )}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
