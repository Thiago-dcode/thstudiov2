"use client"

import { useCallback, useEffect, useState } from "react"
import { useShare } from "./useShare"
import { useGallery } from "../providers/gallery.provider"

export const useGalleryDialog = () => {
    const { items, next, prev, removeCurrentItem, setCurrentItem, currentItem } = useGallery()
    const { share, active: shareActive, supported: shareSupported } = useShare()
    const [copiedIndex, setCopiedIndex] = useState<number>()
    const isOpen = typeof currentItem !== "undefined"
    const currentItemData = isOpen ? items[currentItem] : undefined
    const currentUrl = currentItemData?.url
    const copied = copiedIndex === currentItem

    const handleCopyLink = useCallback(() => {
        if (typeof currentItem === "undefined" || !items[currentItem]?.shared) return
        navigator.clipboard.writeText(items[currentItem].shared).then(() => {
            setCopiedIndex(currentItem)
            setTimeout(() => setCopiedIndex(undefined), 2000)
        })
    }, [currentItem, items])

    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") { e.preventDefault(); prev() }
            if (e.key === "ArrowRight") { e.preventDefault(); next() }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [isOpen, next, prev])

    const handleOpenChange = useCallback(
        (open: boolean) => { if (!open) removeCurrentItem() },
        [removeCurrentItem],
    )

    return {
        items, next, prev, setCurrentItem, currentItem,
        share, shareActive, shareSupported,
        isOpen, currentItemData, currentUrl, copied,
        handleCopyLink, handleOpenChange,
    }
}
