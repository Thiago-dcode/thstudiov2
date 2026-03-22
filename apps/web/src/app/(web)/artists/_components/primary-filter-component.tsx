'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@repo/ui/components/shadcn/accordion'
import CategoryFilter from './category-filter'
import LocationFilter from './location-filter'

export const PrimaryFilterComponent = () => {
    return (
        <div className="flex w-full max-w-sm flex-col gap-4">
            <Accordion
                type="multiple"
                defaultValue={[]}
                className="w-full rounded-md border border-fg-2/40 bg-bg-2/30"
            >
                <AccordionItem value="categories" className="border-fg-2/25 px-3">
                    <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline [&[data-state=open]]:text-fg-2">
                        Categories
                    </AccordionTrigger>
                    <AccordionContent>
                        <CategoryFilter />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="location" className="border-fg-2/25 border-b-0 px-3">
                    <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline [&[data-state=open]]:text-fg-2">
                        Location
                    </AccordionTrigger>
                    <AccordionContent>
                        <LocationFilter />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
