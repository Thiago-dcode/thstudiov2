"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/shadcn/accordion";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/shadcn/popover";
import { cn } from "@repo/ui/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  LocateFixed,
  MapPinOff,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import CategoryFilter from "./category-filter";
import LocationFilter from "./location-filter";
import { NEAR_ME_RADIUS_KM, useNearMe } from "./use-near-me";

const PRIMARY_FILTERS_CONTENT_ID = "artists-primary-filters-popover";

function NearMeRow() {
  const { geoState, isLocated, requestLocation } = useNearMe();
  const isLocating = geoState === "locating";

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      <button
        type="button"
        onClick={requestLocation}
        disabled={isLocating}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium transition-colors",
          "border border-border bg-fg-2/40 hover:bg-fg-2 hover:text-text",
          isLocated ? "border-border-em bg-fg text-text" : "text-text-muted",
          isLocating ? "cursor-wait opacity-70" : "cursor-pointer",
        )}
        aria-live="polite"
      >
        {isLocating ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        ) : isLocated ? (
          <CheckCircle2 className="size-3.5 shrink-0 text-text" aria-hidden />
        ) : (
          <LocateFixed className="size-3.5 shrink-0" aria-hidden />
        )}
        <span>
          {isLocating
            ? "Getting location…"
            : isLocated
              ? `Near me · ${NEAR_ME_RADIUS_KM} km`
              : "Use my location"}
        </span>
      </button>

      {geoState === "denied" && (
        <p
          role="alert"
          className="flex items-center gap-1.5 px-1 text-[10px] leading-snug text-text-muted"
        >
          <MapPinOff className="size-3 shrink-0" aria-hidden />
          Location denied — enable it in browser settings and try again.
        </p>
      )}
      {geoState === "unavailable" && (
        <p
          role="alert"
          className="px-1 text-[10px] leading-snug text-text-muted"
        >
          Couldn&apos;t get your location. Please try again.
        </p>
      )}
    </div>
  );
}

function PrimaryFilterPanel() {
  return (
    <Accordion
      type="multiple"
      defaultValue={["categories", "location"]}
      className="w-full bg-fg-2/30"
    >
      <AccordionItem
        value="categories"
        className="border-b-2 py-2 border-border px-3"
      >
        <AccordionTrigger className="cursor-pointer py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline data-[state=open]:text-text">
          Categories
        </AccordionTrigger>
        <AccordionContent>
          <CategoryFilter />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="location" className="border-0 py-2 px-3">
        <AccordionTrigger className="py-3 text-xs font-medium uppercase tracking-[0.12em] text-text-muted hover:no-underline data-[state=open]:text-text cursor-pointer">
          Location
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-3">
          <NearMeRow />
          <LocationFilter />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** Categories & location filters: trigger in the search bar, panel in a popover. */
export function PrimaryFiltersDropdown() {
  const [open, setOpen] = useState(false);

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
            "group flex h-14 min-h-14 w-full shrink-0 justify-between gap-2 border-2 border-border bg-fg-2 px-4 text-left shadow-none transition-colors",
            "hover:bg-fg-2/40 hover:text-text",
            "text-xs font-medium uppercase tracking-[0.12em] text-text-muted",
            "tablet:h-14 tablet:w-12 tablet:justify-center tablet:border-0 tablet:border-r-2 tablet:border-border tablet:px-0",
            open &&
              "border-text/35 bg-fg-2/45 text-text ring-2 ring-text/10 tablet:ring-0",
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5 tablet:gap-0">
            <SlidersHorizontal
              className={cn(
                "size-4 shrink-0 text-text-muted transition-transform duration-300 group-hover:text-text/90 tablet:size-5",
                "group-hover:scale-105",
                open && "text-text",
              )}
              aria-hidden
            />
            <span className="tablet:sr-only">Categories &amp; location</span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-text-muted opacity-60 transition-[transform,opacity,color] duration-300 group-hover:text-text/90 group-hover:opacity-90 tablet:hidden",
              open && "rotate-180 text-text opacity-100",
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
          "w-[min(100vw,32rem)] max-h-[min(70vh,42rem)] overflow-y-auto p-2",
          "border border-border bg-bg text-text shadow-lg backdrop-blur-sm",
        )}
      >
        <PrimaryFilterPanel />
      </PopoverContent>
    </Popover>
  );
}
