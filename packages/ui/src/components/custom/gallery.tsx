"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Link as LinkIcon, Share2, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef } from "react"
import { useGalleryDialog } from "../../hooks/useGalleryDialog"
import { cn } from "../../lib/utils"

export const Gallery = () => {
    const {
        items, next, prev, setCurrentItem, currentItem,
        share, shareActive, shareSupported,
        isOpen, currentItemData, currentUrl, copied,
        handleCopyLink, handleOpenChange,
    } = useGalleryDialog()
    const thumbnailsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen || !thumbnailsRef.current) return
        const active = thumbnailsRef.current.querySelector<HTMLElement>('[data-active="true"]')
        active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }, [currentItem, isOpen])

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
                    className={cn(
                        "fixed inset-0 z-50 flex flex-col outline-none",
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

                    <DialogPrimitive.Close
                        className="absolute top-5 right-5 z-10 cursor-pointer p-2 text-white/50 hover:text-white transition-colors duration-200 focus:outline-none"
                    >
                        <X className="size-5" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>

                    {/* Main image area */}
                    <div className="relative flex-1 flex items-center justify-center min-h-0 px-16 pt-12 pb-4">
                        {items.length > 1 && (
                            <button
                                onClick={prev}
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 text-white/30 hover:text-white/80 transition-colors duration-200 focus:outline-none"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="size-7" strokeWidth={1.5} />
                            </button>
                        )}

                        {currentUrl && (
                            <div className="flex flex-col items-center gap-3 w-full h-full">
                                <div className="group/img relative size-fit max-w-[85vw] max-h-[72vh]">
                                    {currentItemData?.title ? (
                                        <p className="absolute -top-6 left-0 font-medium">{currentItemData.title}</p>
                                    ) : null}
                                    <img
                                        src={currentUrl}
                                        alt={currentItemData?.alt || currentItemData?.title || ""}
                                        className="block max-w-full max-h-[72vh] w-auto h-auto object-contain"
                                    />
                                    {(currentItemData?.href || currentItemData?.shared) && (
                                        <div className="absolute bottom-2 right-2 flex flex-col gap-1 opacity-0 group-hover/img:opacity-100 transition-all duration-200">
                                            {currentItemData.href && (
                                                <a
                                                    href={currentItemData.href}
                                                    className="p-1.5 rounded-sm bg-black/40 text-white/50 hover:text-white hover:bg-black/60 backdrop-blur-sm transition-all duration-200 focus:outline-none"
                                                    aria-label="Open media page"
                                                >
                                                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                                                </a>
                                            )}
                                            {currentItemData.shared && (
                                                <button
                                                    onClick={handleCopyLink}
                                                    className="p-1.5 rounded-sm bg-black/40 text-white/50 hover:text-white hover:bg-black/60 backdrop-blur-sm transition-all duration-200 cursor-pointer focus:outline-none"
                                                    aria-label={copied ? "Link copied" : "Copy media link"}
                                                >
                                                    {copied
                                                        ? <Check className="size-3.5" strokeWidth={2} />
                                                        : <LinkIcon className="size-3.5" strokeWidth={2} />
                                                    }
                                                </button>
                                            )}
                                            {shareSupported && currentItemData?.shared && (
                                                <button
                                                    onClick={() => share({ url: currentItemData.shared!, title: currentItemData.title })}
                                                    className="p-1.5 rounded-sm bg-black/40 text-white/50 hover:text-white hover:bg-black/60 backdrop-blur-sm transition-all duration-200 cursor-pointer focus:outline-none"
                                                    aria-label={shareActive ? "Shared" : "Share"}
                                                >
                                                    {shareActive
                                                        ? <Check className="size-3.5" strokeWidth={2} />
                                                        : <Share2 className="size-3.5" strokeWidth={2} />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {items.length > 1 && (
                            <button
                                onClick={next}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 text-white/30 hover:text-white/80 transition-colors duration-200 focus:outline-none"
                                aria-label="Next image"
                            >
                                <ChevronRight className="size-7" strokeWidth={1.5} />
                            </button>
                        )}
                    </div>

                    {/* Dot indicators (only when <= 15 items) */}
                    {items.length > 1 && items.length <= 15 && (
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
                    {items.length > 1 && (
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
