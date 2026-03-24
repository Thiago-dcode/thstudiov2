'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@repo/ui/components/shadcn/accordion'
import { Button } from '@repo/ui/components/shadcn/button'
import { cn } from '@repo/ui/lib/utils'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import CategoryFilter from './category-filter'
import { useFilters } from './filters.provider'
import LocationFilter from './location-filter'

const PRIMARY_FILTERS_PANEL_ID = 'artists-primary-filters'

export const TogglePrimaryFilter = () => {
    const { isPrimaryFilterActive, setIsPrimaryFilterActive } = useFilters()

    return (
        <Button
            type="button"
            variant="ghost"
            aria-label="Categories and location filters"
            aria-expanded={isPrimaryFilterActive}
            aria-controls={
                isPrimaryFilterActive ? PRIMARY_FILTERS_PANEL_ID : undefined
            }
            onClick={() => setIsPrimaryFilterActive((open) => !open)}
            className={cn(
                'group h-14 shrink-0 justify-between gap-2 rounded-md border px-4 text-left shadow-none transition-colors',
                'border-fg bg-bg-2/20 hover:bg-bg-2/35 hover:text-fg-2',
                'text-xs font-medium uppercase tracking-[0.12em] text-text-muted',
                'w-full tablet:w-14 tablet:justify-center tablet:px-0',
                'tablet:rounded-l-md tablet:rounded-r-none tablet:border-r-0',
                isPrimaryFilterActive &&
                    'border-fg-2/55 bg-bg-2/40 text-fg-2 ring-1 ring-fg-2/20 tablet:ring-0',
            )}
        >
            <span className="flex items-center gap-2.5 tablet:gap-0">
                <SlidersHorizontal
                    className={cn(
                        'size-4 shrink-0 transition-transform duration-300 tablet:size-5',
                        'group-hover:scale-105',
                        isPrimaryFilterActive && 'text-fg-2',
                    )}
                    aria-hidden
                />
                <span className="tablet:sr-only">Categories &amp; location</span>
            </span>
            <ChevronDown
                className={cn(
                    'size-4 shrink-0 opacity-60 transition-transform duration-300 tablet:hidden',
                    isPrimaryFilterActive && 'rotate-180 opacity-100',
                )}
                aria-hidden
            />
        </Button>
    )
}

export const PrimaryFilterComponent = () => {
    const { isPrimaryFilterActive } = useFilters()

    return (
        <div className="flex w-full max-w-sm flex-col gap-3">
            {isPrimaryFilterActive ? (
                <div
                    id={PRIMARY_FILTERS_PANEL_ID}
                    className="animate-in fade-in slide-in-from-top-1 duration-200"
                >
                    <Accordion
                        type="multiple"
                        defaultValue={[]}
                        className="w-full rounded-md border border-fg-2/40 bg-bg-2/30"
                    >
                        <AccordionItem value="categories" className="border-fg-2/25 px-3">
                            <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline data-[state=open]:text-fg-2">
                                Categories
                            </AccordionTrigger>
                            <AccordionContent>
                                <CategoryFilter />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="location" className="border-fg-2/25 border-b-0 px-3">
                            <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline data-[state=open]:text-fg-2">
                                Location
                            </AccordionTrigger>
                            <AccordionContent>
                                <LocationFilter />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            ) : null}
        </div>
    )
}
