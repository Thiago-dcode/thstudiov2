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
import { useEffect, useState } from 'react'
import FiltersLists from './filters-lists'
import { useFilters } from './filters.provider'

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

export default function FilterSearch() {
    const router = useRouter()
    const { filters } = useFilters()
    const [query, setQuery] = useState(() => filters.search ?? '')

    useEffect(() => {
        setQuery(filters.search ?? '')
    }, [filters.search])

    const apply = () => {
        const trimmed = query.trim()
        const next: ArtistIndexRequest = { ...filters }
        if (trimmed) {
            next.search = trimmed
        } else {
            delete next.search
        }
        const href = queryParamBuilder(
            '/artists',
            artistFiltersToQueryBuilder(next),
            { arrayStyle: 'commas' },
        )
        router.push(href)
    }

    return (
        <form
            role="search"
            aria-label="Search artists"
            className="flex w-full flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault()
                apply()
            }}
        >
            <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-stretch tablet:gap-0">
                <div className="relative min-w-0 flex-1">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted"
                        aria-hidden
                    />
                    <Input
                        type="search"
                        name="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search artists by name, profession, bio…"
                        className={cn(
                            'h-14 min-h-14 w-full rounded-none border-fg-2/40 bg-bg-2/30 pr-4 pl-12',
                            'text-base leading-snug placeholder:text-text-muted/70 tablet:text-lg',
                            'tablet:rounded-l-md tablet:rounded-r-none tablet:border-r-0',
                            'focus-visible:border-fg-2/60 focus-visible:ring-fg-2/25',
                        )}
                        autoComplete="off"
                    />
                </div>
                <Button
                    type="submit"
                    className={cn(
                        'h-14 shrink-0 rounded-md px-8 text-sm font-medium uppercase tracking-[0.08em]',
                        'tablet:rounded-l-none tablet:rounded-r-md',
                    )}
                >
                    Search
                </Button>
            </div>
            <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-2">
                <FiltersLists />
            </div>
        </form>
    )
}
