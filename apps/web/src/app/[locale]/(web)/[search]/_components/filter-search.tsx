"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { cn } from "@repo/ui/lib/utils";
import { Search } from "lucide-react";
import { useRef } from "react";
import { useFilters } from "./filters.provider";
import FiltersLists from "./filters-lists";
import { PrimaryFiltersDropdown } from "./primary-filter-component";

export function FilterSearch() {
  const { segment, add } = useFilters();
  const searchInput = useRef<HTMLInputElement | null>(null);

  return (
    <search
      aria-label={`Search ${segment}`}
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-3",
        // centered ? 'max-w-2xl tablet:max-w-3xl' : 'max-w-4xl',
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();

          const value = searchInput.current?.value.trim();
          if (!value) return;
          add("search", value);
          if (searchInput.current) searchInput.current.value = "";
        }}
      >
        <div
          className={cn(
            "flex w-full flex-col gap-3",
            "tablet:flex-row tablet:items-stretch tablet:gap-0 tablet:overflow-hidden tablet:shadow-sm tablet:ring-1 tablet:ring-border",
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
              className="h-14 min-h-14 w-full pr-4 pl-12 text-base leading-snug tablet:text-lg"
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            variant="default"
            className={cn(
              "h-14 min-h-14 shrink-0 px-8 text-sm font-semibold uppercase tracking-[0.08em] shadow-sm",
              "",
            )}
          >
            Search
          </Button>
        </div>
      </form>
      <FiltersLists />
    </search>
  );
}
