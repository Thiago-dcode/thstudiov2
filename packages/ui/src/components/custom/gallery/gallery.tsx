"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowUpRight, Check, Maximize2, Minimize2, Share2, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFullscreen } from "../../../hooks/useFullscreen"
import { useGalleryDialog } from "../../../hooks/useGalleryDialog"
import { cn } from "../../../lib/utils"
import { GalleryArrow } from "./gallery-arrow"
import { useSwipe } from "./use-swipe"

const TRACK_TRANSITION = "transform 250ms cubic-bezier(.4,0,.2,1)"
const SLIDE_SIZE_FS = "max-w-[95vw] max-h-[90vh]"
const SLIDE_SIZE = "max-w-[85vw] max-h-[72vh]"
const SLIDE_PADDING_FS = "pt-10 pb-2"
const SLIDE_PADDING = "pt-12 pb-4"
const ACTION_PILL = "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-xs focus:outline-none"

type AdjacentSlideProps = {
    url: string
    direction: "prev" | "next"
    offsetX: number
    animate: boolean
    fullscreen: boolean
}

const AdjacentSlide = ({ url, direction, offsetX, animate, fullscreen }: AdjacentSlideProps) => (
    <div
        className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none",
            fullscreen ? SLIDE_PADDING_FS : SLIDE_PADDING,
        )}
        style={{
            transform: `translateX(calc(${direction === "prev" ? "-" : ""}100% + ${offsetX}px))`,
            transition: animate ? TRACK_TRANSITION : "none",
        }}
    >
        <img
            src={url}
            alt=""
            className={cn(fullscreen ? SLIDE_SIZE_FS : SLIDE_SIZE, "object-contain")}
            draggable={false}
        />
    </div>
)

export const Gallery = () => {
    const {
        items, next, prev, setCurrentItem, currentItem,
        share, shareActive, shareSupported,
        isOpen, currentItemData, currentUrl, copied,
        handleCopyLink, handleOpenChange,
    } = useGalleryDialog()
    const thumbnailsRef = useRef<HTMLDivElement>(null)
    const { handlers: swipeHandlers, offsetX, animate, active, onTransitionEnd } = useSwipe({ onSwipeLeft: next, onSwipeRight: prev })

    const { ref: contentRef, fullscreen, toggleFullscreen, exitFullscreen } = useFullscreen<HTMLDivElement>()
    const [fsControls, setFsControls] = useState(false)

    useEffect(() => {
        if (!fullscreen) {
            // This is a direct UI state reset derived from fullscreen.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFsControls(false)
        }
    }, [fullscreen])

    useEffect(() => {
        if (!isOpen) exitFullscreen()
    }, [isOpen, exitFullscreen])

    useEffect(() => {
        // Derived UI state reset when switching items.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFsControls(false)
    }, [currentItem])

    const adjacent = useMemo(() => {
        if (currentItem == null || items.length <= 1) return { prevUrl: null, nextUrl: null }
        const pi = (currentItem - 1 + items.length) % items.length
        const ni = (currentItem + 1) % items.length
        return { prevUrl: items[pi]?.url ?? null, nextUrl: items[ni]?.url ?? null }
    }, [currentItem, items])

    useEffect(() => {
        if (!isOpen || !thumbnailsRef.current) return
        const activeThumbnail = thumbnailsRef.current.querySelector<HTMLElement>('[data-active="true"]')
        activeThumbnail?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }, [currentItem, isOpen])

    const slideSize = fullscreen ? SLIDE_SIZE_FS : SLIDE_SIZE
    const hasMultiple = items.length > 1

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        "fixed inset-0 z-50 backdrop-blur-2xl bg-black/30",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300",
                    )}
                />

                <DialogPrimitive.Content
                    ref={contentRef}
                    className={cn(
                        "fixed inset-0 z-50 flex flex-col outline-none bg-black/0",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200",
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">
                        Gallery
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Image {(currentItem ?? 0) + 1} of {items.length}
                    </DialogPrimitive.Description>

                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-5 left-5 z-10 cursor-pointer p-2 text-white/50 hover:text-white transition-colors duration-200 focus:outline-none"
                        aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {fullscreen
                            ? <Minimize2 className="size-4" strokeWidth={1.5} />
                            : <Maximize2 className="size-4" strokeWidth={1.5} />
                        }
                    </button>

                    <DialogPrimitive.Close
                        className="absolute top-5 right-5 z-10 cursor-pointer p-2 text-white/50 hover:text-white transition-colors duration-200 focus:outline-none"
                    >
                        <X className="size-5" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>

                    {/* Main image area */}
                    <div
                        className={cn(
                            "relative flex-1 overflow-hidden touch-pan-y",
                            fullscreen ? SLIDE_PADDING_FS : SLIDE_PADDING,
                        )}
                        {...swipeHandlers}
                    >
                        {hasMultiple && (
                            <>
                                <GalleryArrow direction="left" onClick={prev} />
                                <GalleryArrow direction="right" onClick={next} />
                            </>
                        )}

                        {active && adjacent.prevUrl && (
                            <AdjacentSlide url={adjacent.prevUrl} direction="prev" offsetX={offsetX} animate={animate} fullscreen={fullscreen} />
                        )}

                        {active && adjacent.nextUrl && (
                            <AdjacentSlide url={adjacent.nextUrl} direction="next" offsetX={offsetX} animate={animate} fullscreen={fullscreen} />
                        )}

                        {/* Current slide */}
                        {currentUrl && (
                            <div
                                className="relative flex flex-col justify-center items-center h-full"
                                style={{
                                    transform: `translateX(${offsetX}px)`,
                                    transition: animate ? TRACK_TRANSITION : "none",
                                    willChange: active ? "transform" : "auto",
                                }}
                                onTransitionEnd={onTransitionEnd}
                            >
                                <div className={cn("group/img relative size-fit", slideSize)}>
                                    {currentItemData?.title ? (
                                        <p className="absolute -top-6 left-0 font-medium text-xs laptop:text-sm line-clamp-1">{currentItemData.title}</p>
                                    ) : null}
                                    <img
                                        src={currentUrl}
                                        alt={currentItemData?.alt || currentItemData?.title || ""}
                                        className="block h-full object-contain"
                                        draggable={false}
                                        onClick={fullscreen ? () => setFsControls(v => !v) : undefined}
                                    />
                                </div>

                                {(currentItemData?.href || currentItemData?.shared) && (
                                    <div
                                        className={cn(
                                            "flex items-center justify-center gap-3 transition-opacity duration-200",
                                            fullscreen
                                                ? cn("absolute bottom-4 left-0 right-0", fsControls ? "opacity-100" : "opacity-0 pointer-events-none")
                                                : "mt-3 opacity-100",
                                        )}
                                        onPointerDown={e => e.stopPropagation()}
                                    >
                                        {currentItemData.href && (
                                            <a
                                                href={currentItemData.href}
                                                className={ACTION_PILL}
                                                aria-label="Open media page"
                                            >
                                                <ArrowUpRight className="size-3.5" strokeWidth={2} />
                                                <span>Open</span>
                                            </a>
                                        )}
                                        {currentItemData.shared && (
                                            <button
                                                onClick={shareSupported
                                                    ? () => share({ url: currentItemData.shared!, title: currentItemData.title })
                                                    : handleCopyLink
                                                }
                                                className={cn(ACTION_PILL, "cursor-pointer")}
                                                aria-label="Share"
                                            >
                                                {(shareActive || copied)
                                                    ? <><Check className="size-3.5" strokeWidth={2} /><span>{copied ? "Copied" : "Shared"}</span></>
                                                    : <><Share2 className="size-3.5" strokeWidth={2} /><span>Share</span></>
                                                }
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dot indicators (only when <= 15 items) */}
                    {!fullscreen && hasMultiple && items.length <= 15 && (
                        <div className="flex items-center justify-center gap-2 py-2">
                            {items.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentItem(i)}
                                    className={cn(
                                        "cursor-pointer rounded-full transition-all duration-300 focus:outline-none",
                                        i === currentItem
                                            ? "size-2 bg-white/80"
                                            : "size-1.5 bg-white/20 hover:bg-white/40",
                                    )}
                                    aria-label={`Go to image ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Thumbnail strip */}
                    {!fullscreen && hasMultiple && (
                        <div
                            ref={thumbnailsRef}
                            className="flex items-center justify-center gap-1.5 px-4 pb-5 pt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {items.map((item, i) => (
                                item.url ? (
                                    <button
                                        key={i}
                                        data-active={i === currentItem}
                                        onClick={() => setCurrentItem(i)}
                                        className={cn(
                                            "relative shrink-0 size-14 cursor-pointer rounded-sm overflow-hidden transition-all duration-300 focus:outline-none",
                                            i === currentItem
                                                ? "ring-1 ring-white/60 opacity-100 scale-105"
                                                : "opacity-35 hover:opacity-65",
                                        )}
                                    >
                                        <Image
                                            src={item.url}
                                            alt={item.title ?? ""}
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                        />
                                    </button>
                                ) : null
                            ))}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
