'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@repo/ui/components/shadcn/accordion'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'
import { cn } from '@repo/ui/lib/utils'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import CategoryFilter from './category-filter'
import LocationFilter from './location-filter'

const PRIMARY_FILTERS_CONTENT_ID = 'artists-primary-filters-popover'

function PrimaryFilterPanel() {
    return (
        <Accordion
            type="multiple"
            defaultValue={[]}
            className="w-full rounded-sm bg-bg-2/30"
        >
            <AccordionItem value="categories" className="border-b-2 border-border px-3">
                <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline data-[state=open]:text-text">
                    Categories
                </AccordionTrigger>
                <AccordionContent>
                    <CategoryFilter />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="location" className="border-0 px-3">
                <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline data-[state=open]:text-text">
                    Location
                </AccordionTrigger>
                <AccordionContent>
                    <LocationFilter />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

/** Categories & location filters: trigger in the search bar, panel in a popover. */
export function PrimaryFiltersDropdown() {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    aria-label="Categories and location filters"
                    aria-expanded={open}
                    aria-controls={open ? PRIMARY_FILTERS_CONTENT_ID : undefined}
                    className={cn(
                        'group flex h-14 min-h-14 w-full shrink-0 justify-between gap-2 rounded-md border-2 border-border bg-bg-2/25 px-4 text-left shadow-none transition-colors',
                        'hover:bg-bg-2/40 hover:text-text',
                        'text-xs font-medium uppercase tracking-[0.12em] text-text-muted',
                        'tablet:h-14 tablet:w-12 tablet:justify-center tablet:rounded-none tablet:border-0 tablet:border-r-2 tablet:border-border tablet:px-0',
                        open &&
                            'border-text/35 bg-bg-2/45 text-text ring-2 ring-text/10 tablet:ring-0',
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2.5 tablet:gap-0">
                        <SlidersHorizontal
                            className={cn(
                                'size-4 shrink-0 text-text-muted transition-transform duration-300 group-hover:text-text/90 tablet:size-5',
                                'group-hover:scale-105',
                                open && 'text-text',
                            )}
                            aria-hidden
                        />
                        <span className="tablet:sr-only">Categories &amp; location</span>
                    </span>
                    <ChevronDown
                        className={cn(
                            'size-4 shrink-0 text-text-muted opacity-60 transition-[transform,opacity,color] duration-300 group-hover:text-text/90 group-hover:opacity-90 tablet:hidden',
                            open && 'rotate-180 text-text opacity-100',
                        )}
                        aria-hidden
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                id={PRIMARY_FILTERS_CONTENT_ID}
                align="start"
                sideOffset={8}
                collisionPadding={12}
                className={cn(
                    'w-[min(calc(100vw-1.5rem),20rem)] max-h-[min(70vh,28rem)] overflow-y-auto p-2',
                    'border border-border bg-bg-2/95 text-text shadow-lg backdrop-blur-sm',
                )}
            >
                <PrimaryFilterPanel />
            </PopoverContent>
        </Popover>
    )
}
