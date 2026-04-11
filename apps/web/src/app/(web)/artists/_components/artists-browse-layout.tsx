'use client'

import { ArtistIndexRequest } from '@repo/common-lib/types/user'
import { cn } from '@repo/ui/lib/utils'
import { ReactNode } from 'react'
import FilterSearch from './filter-search'

type ArtistsBrowseLayoutProps = {
    initialFilters: ArtistIndexRequest
    children: ReactNode
    /** No query yet: vertically center the search block in the viewport. */
    centerSearch?: boolean
}

export function ArtistsBrowseLayout({
    initialFilters,
    children,
    centerSearch = false,
}: ArtistsBrowseLayoutProps) {
    return (
        <div className={cn('flex w-full flex-col gap-8')}>
            <FilterSearch initialFilters={initialFilters} centered={centerSearch} />
            <div className="min-w-0 w-full">{children}</div>
        </div>
    )
}
