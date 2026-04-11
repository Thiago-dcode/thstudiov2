'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

export type GalleryItem = {
    title?: string
    description?: string
    url?: string
    alt?: string
    href?:string,
    shared?: string
}

type GalleryContextType = {
    currentItem?: number
    items: GalleryItem[]
    setCurrentItem: (item: number | undefined) => void
    removeCurrentItem: () => void
    next: () => void
    prev: () => void
}

const GalleryContext = createContext<GalleryContextType>({
    items: [],
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
}: {
    children: ReactNode
    defaultCurrentItem?:number,
    items?: GalleryItem[]
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
