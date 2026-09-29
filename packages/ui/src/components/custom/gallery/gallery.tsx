"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowUpRight, Check, Maximize2, Minimize2, Share2, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useFullscreen } from "../../../hooks/useFullscreen"
import { useGalleryDialog } from "../../../hooks/useGalleryDialog"
import type { GalleryItem } from "../../../providers/gallery.provider"
import { cn } from "../../../lib/utils"
import { GalleryArrow } from "./gallery-arrow"
import { useSwipe } from "./use-swipe"

const TRACK_TRANSITION = "transform 250ms cubic-bezier(.4,0,.2,1)"
const SLIDE_SIZE_FS = "max-w-[95vw] max-h-[90vh]"
const SLIDE_SIZE = "max-w-[85vw] max-h-[72vh]"
const SLIDE_PADDING_FS = "pt-10 pb-2"
const SLIDE_PADDING = "pt-12 pb-4"
const ACTION_PILL = "flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200 text-xs focus:outline-none"
// Every slide — the current one and the two that peek in during a swipe — is the same stack:
// the image frame, then a fixed-height actions row that is reserved even when a slide has no
// actions. The image is centred together with that row, so it has to be the same on all of them:
// when only the current slide had the row, a swipe landed and the new image jumped up by half
// its height as the pills appeared under it.
const SLIDE_STACK = "flex flex-col justify-center items-center h-full"
const SLIDE_FRAME = "relative size-fit"
const SLIDE_MEDIA = "block h-full object-contain"
const ACTIONS_ROW = "mt-3 h-8 shrink-0"

/** Neighbours warmed ahead of time, as offsets from the current slide. */
const PRELOAD_OFFSETS = [1, -1, 2]

// A video neighbour shows its poster, never a second <video>: these slides exist only to peek in
// during a swipe, and decoding three streams at once for that is not worth it.
const previewUrl = (item?: GalleryItem) =>
 (item?.mediaType === "VIDEO" ? item.poster : item?.url) ?? null

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
 "absolute inset-0 pointer-events-none",
 fullscreen ? SLIDE_PADDING_FS : SLIDE_PADDING,
 )}
 style={{
 transform: `translateX(calc(${direction === "prev" ? "-" : ""}100% + ${offsetX}px))`,
 transition: animate ? TRACK_TRANSITION : "none",
 }}
 >
 <div className={SLIDE_STACK}>
 <div className={cn(SLIDE_FRAME, fullscreen ? SLIDE_SIZE_FS : SLIDE_SIZE)}>
 <img src={url} alt="" className={SLIDE_MEDIA} draggable={false} />
 </div>
 {!fullscreen && <div aria-hidden="true" className={ACTIONS_ROW} />}
 </div>
 </div>
)

export const Gallery = () => {
 const {
 items, labels, next, prev, setCurrentItem, currentItem,
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
 return { prevUrl: previewUrl(items[pi]), nextUrl: previewUrl(items[ni]) }
 }, [currentItem, items])

 // Warm the neighbours' full-size files while the current one is on screen. Without this the
 // next image only started downloading once it was already the current slide (the adjacent
 // slides mount only mid-swipe), so every first visit to a photo showed an empty beat. The
 // Image objects are kept so the requests aren't dropped and each URL is fetched once.
 const preloaded = useRef(new Map<string, HTMLImageElement>())
 useEffect(() => {
 if (!isOpen || currentItem == null || items.length <= 1) return
 for (const offset of PRELOAD_OFFSETS) {
 const url = previewUrl(items[(currentItem + offset + items.length * 2) % items.length])
 if (!url || preloaded.current.has(url)) continue
 const img = new window.Image()
 img.decoding = "async"
 img.src = url
 img.decode?.().catch(() => { })
 preloaded.current.set(url, img)
 }
 }, [currentItem, isOpen, items])

 // Which URL has its real size yet. Until then the slide has no height, so the title and the
 // action pills — laid out around the image — would sit in the middle and then jump when it
 // arrives. They stay hidden until the media is ready and appear already in place. An already
 // cached image is caught on mount (before paint), so it shows instantly with no fade.
 const [ready, setReady] = useState<{ url: string; fade: boolean } | null>(null)
 const mediaReady = currentUrl != null && ready?.url === currentUrl
 const markReady = useCallback((url: string | null | undefined, fade: boolean) => {
 if (url) setReady({ url, fade })
 }, [])
 const imgRef = useCallback((el: HTMLImageElement | null) => {
 if (el?.complete && el.naturalWidth > 0) markReady(el.getAttribute("src"), false)
 }, [markReady])
 const videoRef = useCallback((el: HTMLVideoElement | null) => {
 if (el && el.readyState >= HTMLMediaElement.HAVE_METADATA) markReady(el.getAttribute("src"), false)
 }, [markReady])
 const mediaVisibility = mediaReady
 ? cn("opacity-100", ready?.fade && "transition-opacity duration-200")
 : "opacity-0"

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
 className={cn("relative", SLIDE_STACK)}
 style={{
 transform: `translateX(${offsetX}px)`,
 transition: animate ? TRACK_TRANSITION : "none",
 willChange: active ? "transform" : "auto",
 }}
 onTransitionEnd={onTransitionEnd}
 >
 <div className={cn("group/img", SLIDE_FRAME, slideSize)}>
 {currentItemData?.title ? (
 <p className={cn("absolute -top-6 left-0 font-medium text-xs laptop:text-sm line-clamp-1", mediaVisibility)}>{currentItemData.title}</p>
 ) : null}
 {currentItemData?.mediaType === "VIDEO" ? (
 // `controls` rather than autoplay: the lightbox is opened deliberately, and an
 // autoplaying video would start downloading megabytes the moment someone swipes
 // past. `preload="metadata"` keeps that to the header until they press play.
 // The click-to-toggle-chrome handler is dropped here — it would fight the
 // player's own controls for the same clicks.
 <video
 key={currentUrl}
 ref={videoRef}
 onLoadedMetadata={() => markReady(currentUrl, true)}
 onError={() => markReady(currentUrl, true)}
 src={currentUrl}
 poster={currentItemData.poster ?? undefined}
 controls
 playsInline
 preload="metadata"
 aria-label={currentItemData?.alt || currentItemData?.title || ""}
 className={cn(SLIDE_MEDIA, mediaVisibility)}
 onPointerDown={e => e.stopPropagation()}
 />
 ) : (
 // Keyed by URL so a new item gets a fresh element: reusing one kept painting the
 // previous photo under the new title until the new file arrived.
 <img
 key={currentUrl}
 ref={imgRef}
 onLoad={() => markReady(currentUrl, true)}
 onError={() => markReady(currentUrl, true)}
 src={currentUrl}
 alt={currentItemData?.alt || currentItemData?.title || ""}
 className={cn(SLIDE_MEDIA, mediaVisibility)}
 draggable={false}
 onClick={fullscreen ? () => setFsControls(v => !v) : undefined}
 />
 )}
 </div>

 {(currentItemData?.href || currentItemData?.shared) ? (
 <div
 className={cn(
 "flex items-center justify-center gap-3 transition-opacity duration-200",
 fullscreen
 ? cn("absolute bottom-4 left-0 right-0", fsControls ? "opacity-100" : "opacity-0 pointer-events-none")
 : cn(ACTIONS_ROW, mediaVisibility, !mediaReady && "pointer-events-none"),
 )}
 onPointerDown={e => e.stopPropagation()}
 >
 {currentItemData.href && (
 <a
 href={currentItemData.href}
 className={ACTION_PILL}
 aria-label={labels.openAria}
 >
 <ArrowUpRight className="size-3.5" strokeWidth={2} />
 <span>{labels.open}</span>
 </a>
 )}
 {currentItemData.shared && (
 <button
 onClick={shareSupported
 ? () => share({ url: currentItemData.shared!, title: currentItemData.title })
 : handleCopyLink
 }
 className={cn(ACTION_PILL, "cursor-pointer")}
 aria-label={labels.shareAria}
 >
 {(shareActive || copied)
 ? <><Check className="size-3.5" strokeWidth={2} /><span>{copied ? labels.copied : labels.shared}</span></>
 : <><Share2 className="size-3.5" strokeWidth={2} /><span>{labels.share}</span></>
 }
 </button>
 )}
 </div>
 ) : !fullscreen ? (
 <div aria-hidden="true" className={ACTIONS_ROW} />
 ) : null}
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
 "cursor-pointer transition-all duration-300 focus:outline-none",
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
 "relative shrink-0 size-14 cursor-pointer overflow-hidden transition-all duration-300 focus:outline-none",
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
