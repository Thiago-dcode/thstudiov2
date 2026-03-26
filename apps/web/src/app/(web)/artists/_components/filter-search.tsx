'use client'

import { ArtistIndexRequest } from '@repo/common-lib/types/user'
import {
    QueryBuilder,
    queryParamBuilder,
} from '@repo/common-lib/utils/query-builder'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { cn } from '@repo/ui/lib/utils'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import FiltersLists from './filters-lists'
import { useFilters } from './filters.provider'
import { PrimaryFiltersDropdown } from './primary-filter-component'

/** Same shape as `buildArtistIndexRequest` in `page.tsx` — only defined / non-empty values. */
function artistFiltersToQueryBuilder(filters: ArtistIndexRequest): QueryBuilder {
    const out: QueryBuilder = {}
    if (filters.page != null) out.page = filters.page
    if (filters.per_page != null) out.per_page = filters.per_page
    const search = filters.search?.trim()
    if (search) out.search = search
    if (filters.categories?.length) out.categories = filters.categories
    const country = filters.country?.trim()
    if (country) out.country = country
    const state = filters.state?.trim()
    if (state) out.state = state
    const city = filters.city?.trim()
    if (city) out.city = city
    if (filters.lat != null) out.lat = filters.lat
    if (filters.lng != null) out.lng = filters.lng
    if (filters.radius_km != null) out.radius_km = filters.radius_km
    return out
}



function FilterSearchInner({
    initialFilters,
    centered = false,
}: {
    initialFilters: ArtistIndexRequest
    /** Landing state: slightly narrower bar, pairs with layout vertical centering. */
    centered?: boolean
}) {
    const router = useRouter()
    const { filters,add } = useFilters()
    const searchInput = useRef<HTMLInputElement | null>(null)

    const initialUrl = useMemo(
        () =>
            queryParamBuilder(
                '/artists',
                artistFiltersToQueryBuilder(initialFilters),
                { arrayStyle: 'commas' },
            ),
        [initialFilters],
    )

    const newUrl = useMemo(
        () =>
            queryParamBuilder(
                '/artists',
                artistFiltersToQueryBuilder(filters),
                { arrayStyle: 'commas' },
            ),
        [filters],
    )
    const urlHasChanged = useMemo(
        () => initialUrl !== newUrl,
        [initialUrl, newUrl],
    )

   


    useEffect(() => {
        if (!urlHasChanged) return
        if(searchInput.current) searchInput.current.value =''
        router.push(newUrl);
    }, [urlHasChanged, newUrl, router])

    return (
        <form
            role="search"
            aria-label="Search artists"
            className={cn(
                'mx-auto flex w-full flex-col gap-3',
                centered ? 'max-w-2xl tablet:max-w-3xl' : 'max-w-4xl',
            )}
            onSubmit={(e) => {
                e.preventDefault()
                
                const value = searchInput.current?.value.trim();
                if(value)  add('search',value);
             
            }}
        >
            <div
                className={cn(
                    'flex w-full flex-col gap-3',
                    'tablet:flex-row tablet:items-stretch tablet:gap-0 tablet:overflow-hidden tablet:rounded-md tablet:border-2 tablet:border-border tablet:shadow-sm tablet:ring-1 tablet:ring-border',
                )}
            >
                <PrimaryFiltersDropdown />
                <div className="relative min-w-0 flex-1">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-4 z-1 size-5 -translate-y-1/2 text-text-muted"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        name="search"
                        ref={searchInput}
                        placeholder="Search artists by username, name, profession, bio…"
                        className={cn(
                            'h-14 min-h-14 w-full rounded-md border-2 border-border bg-bg-2/40 pr-4 pl-12',
                            'text-base leading-snug placeholder:text-text-muted/70 tablet:text-lg',
                            'tablet:rounded-none tablet:border-0 tablet:border-y-0 tablet:border-r-2 tablet:border-border tablet:border-l-0',
                            'focus-visible:z-10 focus-visible:border-text/40 focus-visible:ring-2 focus-visible:ring-text/15',
                        )}
                        autoComplete="off"
                    />
                </div>
                <Button
                type='submit'
                    variant="default"
                    className={cn(
                        'h-14 min-h-14 shrink-0 rounded-md px-8 text-sm font-semibold uppercase tracking-[0.08em] shadow-sm',
                        'tablet:rounded-l-none tablet:rounded-r-[calc(0.375rem-2px)]',
                    )}
                  
                >
                    Search
                </Button>
            </div>
            <FiltersLists />
        </form>
    )
}

export default function FilterSearch(props: {
    initialFilters: ArtistIndexRequest
    centered?: boolean
}) {
    return (
        <Suspense
            fallback={
                <div
                    className={cn(
                        'mx-auto flex w-full flex-col gap-3',
                        props.centered
                            ? 'max-w-2xl tablet:max-w-3xl'
                            : 'max-w-4xl',
                    )}
                    aria-hidden
                >
                    <div className="h-14 min-h-14 w-full rounded-md border-2 border-border bg-bg-2/20 tablet:rounded-md" />
                </div>
            }
        >
            <FilterSearchInner {...props} />
        </Suspense>
    )
}
