'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type GalleryItem = {
    title?: string
    description?: string
    url?: string
    alt?: string
    href?:string,
    shared?: string
    /**
     * Set for video items. The lightbox renders a `<video>` for the slide in view and the
     * static poster for the neighbours — three simultaneous decoding videos on a swipe is a
     * lot of work for two frames nobody looks at.
     */
    mediaType?: 'IMAGE' | 'VIDEO' | 'GIF' | null
    /** Static WebP poster. Used as the `<video poster>` and for the adjacent slides. */
    poster?: string | null
}

/**
 * Visible + assistive text for the gallery chrome. `packages/ui` has no access to the app's
 * translation files, so the strings are passed in — otherwise every locale renders the English
 * "Open"/"Share", including the anchor text of the only link to a media page.
 */
export type GalleryLabels = {
    open: string
    openAria: string
    share: string
    shared: string
    copied: string
    shareAria: string
    /** Last-resort alt text for a media tile that has neither `seo_alt` nor a title. */
    altFallback: string
}

const DEFAULT_LABELS: GalleryLabels = {
    open: 'Open',
    openAria: 'Open media page',
    share: 'Share',
    shared: 'Shared',
    copied: 'Copied',
    shareAria: 'Share',
    altFallback: 'Artwork on A11STUDIO',
}

type GalleryContextType = {
    currentItem?: number
    items: GalleryItem[]
    labels: GalleryLabels
    setCurrentItem: (item: number | undefined) => void
    removeCurrentItem: () => void
    next: () => void
    prev: () => void
}

const GalleryContext = createContext<GalleryContextType>({
    items: [],
    labels: DEFAULT_LABELS,
    setCurrentItem: () => { },
    removeCurrentItem: () => { },
    next: () => { },
    prev: () => { },
})

export const useGallery = () => useContext(GalleryContext)

export const GalleryProvider = ({
    children,
    defaultCurrentItem,
    items: initialItems = [],
    labels = DEFAULT_LABELS,
}: {
    children: ReactNode
    defaultCurrentItem?:number,
    items?: GalleryItem[]
    labels?: GalleryLabels
}) => {
    const [items] = useState<GalleryItem[]>(initialItems)
    const [currentItem, setCurrentItem] = useState<number | undefined>(defaultCurrentItem);
    const removeCurrentItem = () => setCurrentItem(undefined);
    const next = () => {
        if (!items.length) {
            setCurrentItem(undefined);
            return;
        }
        setCurrentItem((prev) => {
            if (typeof prev === 'undefined') return 0;
            return prev >= items.length - 1 ? 0 : prev + 1;
        });
    };
    const prev = () => {
        if (!items.length) {
            setCurrentItem(undefined);
            return;
        }
        setCurrentItem((prev) => {
            if (typeof prev === 'undefined') return items.length - 1;
            return prev <= 0 ? items.length - 1 : prev - 1;
        });
    };

    return (
        <GalleryContext.Provider
            value={{
                currentItem,
                items,
                labels,
                setCurrentItem,
                removeCurrentItem,
                next,
                prev,
            }}
        >
            {children}
        </GalleryContext.Provider>
    )
}
