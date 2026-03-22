'use client'

import { CategoryBase } from '@repo/common-lib/types/category'
import { badgeVariants } from '@repo/ui/components/shadcn/badge'
import { cn } from '@repo/ui/lib/utils'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { useFilters } from './filters.provider'

function categoryLabel(c: CategoryBase) {
    const name = c.translation?.name ?? c.name
    return name?.trim() ? name : `Category #${c.id}`
}

type FilterBadgeItem = {
    key: string
    label: string
    onRemove: () => void
}

export default function FiltersLists() {
    const { filters, categoriesSelected, delete: deleteFilter, removeCategory } = useFilters()

    const items = useMemo((): FilterBadgeItem[] => {
        const out: FilterBadgeItem[] = []

        const search = filters.search?.trim()
        if (search) {
            out.push({
                key: `search-${search}`,
                label: `Search: ${search}`,
                onRemove: () => deleteFilter('search'),
            })
        }

        const country = filters.country?.trim()
        if (country) {
            out.push({
                key: `country-${country}`,
                label: `Country: ${country}`,
                onRemove: () => {
                    deleteFilter('city')
                    deleteFilter('state')
                    deleteFilter('country')
                },
            })
        }

        const state = filters.state?.trim()
        if (state) {
            out.push({
                key: `state-${state}`,
                label: `State: ${state}`,
                onRemove: () => {
                    deleteFilter('city')
                    deleteFilter('state')
                },
            })
        }

        const city = filters.city?.trim()
        if (city) {
            out.push({
                key: `city-${city}`,
                label: `City: ${city}`,
                onRemove: () => deleteFilter('city'),
            })
        }

        for (const cat of categoriesSelected) {
            out.push({
                key: `category-${cat.id}`,
                label: categoryLabel(cat),
                onRemove: () => removeCategory(cat.id),
            })
        }

        return out
    }, [filters.search, filters.country, filters.state, filters.city, categoriesSelected, deleteFilter, removeCategory])

    if (items.length === 0) return null

    return (
        <div
            role="list"
            aria-label="Active filters"
            className="flex flex-wrap gap-2"
        >
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    role="listitem"
                    aria-label={`Remove filter ${item.label}`}
                    onClick={item.onRemove}
                    className={cn(
                        badgeVariants({ variant: 'outline' }),
                        'inline-flex max-w-full cursor-pointer items-center gap-1.5 border-fg-2/40 bg-bg-2/50 py-1 pr-1 pl-2.5 text-[11px] font-normal leading-tight text-text-muted transition-colors hover:border-fg-2/60 hover:bg-bg-2',
                    )}
                >
                    <span className="min-w-0 flex-1 text-left line-clamp-2">{item.label}</span>
                    <span
                        className="pointer-events-none flex size-5 shrink-0 items-center justify-center rounded-sm text-fg-2/80"
                        aria-hidden
                    >
                        <X className="size-3" />
                    </span>
                </button>
            ))}
        </div>
    )
}
