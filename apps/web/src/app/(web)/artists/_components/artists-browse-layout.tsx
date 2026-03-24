'use client'

import { ArtistIndexRequest } from '@repo/common-lib/types/user'
import { cn } from '@repo/ui/lib/utils'
import { ReactNode } from 'react'
import FilterSearch from './filter-search'
import { PrimaryFilterComponent } from './primary-filter-component'
import { useFilters } from './filters.provider'

type ArtistsBrowseLayoutProps = {
    initialFilters: ArtistIndexRequest
    children: ReactNode
}

export function ArtistsBrowseLayout({
    initialFilters,
    children,
}: ArtistsBrowseLayoutProps) {
    const { isPrimaryFilterActive } = useFilters()

    return (
        <div className="flex w-full flex-col gap-8">
            <FilterSearch initialFilters={initialFilters} />
            <div
                className={cn(
                    'flex w-full flex-col tablet:flex-row tablet:items-start',
                    isPrimaryFilterActive ? 'gap-6 tablet:gap-8' : 'gap-6 tablet:gap-0',
                )}
            >
                <aside
                    aria-hidden={!isPrimaryFilterActive}
                    className={cn(
                        'grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
                        isPrimaryFilterActive
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'pointer-events-none grid-rows-[0fr] opacity-0',
                        'tablet:block tablet:shrink-0 tablet:transition-[width,opacity] tablet:duration-300 tablet:ease-in-out',
                        isPrimaryFilterActive
                            ? 'tablet:w-72'
                            : 'tablet:w-0 tablet:pointer-events-none',
                    )}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className="w-full max-w-sm tablet:max-w-none">
                            <PrimaryFilterComponent />
                        </div>
                    </div>
                </aside>
                <div className="min-w-0 flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
