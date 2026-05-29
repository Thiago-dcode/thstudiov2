'use client'

import {
    queryParamBuilder,
} from '@repo/common-lib/utils/query-builder'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { cn } from '@repo/ui/lib/utils'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef } from 'react'
import FiltersLists from './filters-lists'
import { useFilters } from './filters.provider'
import { PrimaryFiltersDropdown } from './primary-filter-component'
import { filtersToQuery } from './search.utils'



export function FilterSearch() {
    const router = useRouter()
    const { segment, filters, add, urlParams } = useFilters()
    const searchInput = useRef<HTMLInputElement | null>(null)

    const initialUrl = useMemo(
        () =>
            queryParamBuilder(
                `/${segment}`,
                filtersToQuery(urlParams),
                { arrayStyle: 'commas' },
            ),
        [segment, urlParams],
    )

    const newUrl = useMemo(
        () =>
            queryParamBuilder(
                `/${segment}`,
                filtersToQuery(filters),
                { arrayStyle: 'commas' },
            ),
        [segment, filters],
    )
    const urlHasChanged = useMemo(
        () => initialUrl !== newUrl,
        [initialUrl, newUrl],
    )




    useEffect(() => {
        if (!urlHasChanged) return
        if (searchInput.current) searchInput.current.value = ''
        router.push(newUrl);
    }, [urlHasChanged, newUrl, router])

    return (
        <form
            role="search"
            aria-label={`Search ${segment}`}
            className={cn(
                'mx-auto flex w-full max-w-4xl flex-col gap-3',
                // centered ? 'max-w-2xl tablet:max-w-3xl' : 'max-w-4xl',
            )}
            onSubmit={(e) => {
                e.preventDefault()

                const value = searchInput.current?.value.trim();
                if (value) add('search', value);

            }}
        >
            <div
                className={cn(
                    'flex w-full flex-col gap-3',
                    'tablet:flex-row tablet:items-stretch tablet:gap-0 tablet:overflow-hidden tablet:rounded-md tablet:shadow-sm tablet:ring-1 tablet:ring-border',
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
                        placeholder={`Search ${segment} by name, style, category…`}
                        className={cn(
                            'h-14 min-h-14 w-full rounded-md border-2 border-border bg-fg-2/40 pr-4 pl-12',
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


