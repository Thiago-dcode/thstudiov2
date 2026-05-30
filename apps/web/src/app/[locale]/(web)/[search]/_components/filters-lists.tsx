"use client";

import type { CategoryBase } from "@repo/common-lib/types/category";
import { Button } from "@repo/ui/components/shadcn/button";
import { cn } from "@repo/ui/lib/utils";
import { LocateFixed, X } from "lucide-react";
import { useMemo } from "react";
import { useFilters } from "./filters.provider";
import { NEAR_ME_SESSION_KEY } from "./use-near-me";

function categoryLabel(c: CategoryBase) {
  const name = c.name;
  return name?.trim() ? name : `Category #${c.id}`;
}

type FilterBadgeItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
};

export default function FiltersLists() {
  const {
    filters,
    categoriesSelected,
    delete: deleteFilter,
    deleteMany,
    removeCategory,
    clearAll,
  } = useFilters();

  const items = useMemo((): FilterBadgeItem[] => {
    const out: FilterBadgeItem[] = [];

    const search = filters.search?.trim();
    if (search) {
      out.push({
        key: `search-${search}`,
        label: `Search: ${search}`,
        onRemove: () => {
          deleteFilter("search");
        },
      });
    }
    if (filters.lat != null && filters.lng != null) {
      out.push({
        key: "geo-location",
        label: "My location",
        icon: <LocateFixed className="size-3 shrink-0" aria-hidden />,
        onRemove: () => {
          sessionStorage.setItem(NEAR_ME_SESSION_KEY, "1");
          deleteMany(["lat", "lng", "radius_km"]);
        },
      });
    }

    const country = filters.country?.trim();
    if (country) {
      out.push({
        key: `country-${country}`,
        label: `Country: ${country}`,
        onRemove: () => deleteMany(["city", "state", "country"]),
      });
    }

    const state = filters.state?.trim();
    if (state) {
      out.push({
        key: `state-${state}`,
        label: `State: ${state}`,
        onRemove: () => deleteMany(["city", "state"]),
      });
    }

    const city = filters.city?.trim();
    if (city) {
      out.push({
        key: `city-${city}`,
        label: `City: ${city}`,
        onRemove: () => deleteFilter("city"),
      });
    }

    for (const cat of categoriesSelected) {
      out.push({
        key: `category-${cat.id}`,
        label: categoryLabel(cat),
        onRemove: () => removeCategory(cat.slug),
      });
    }

    return out;
  }, [filters, categoriesSelected, deleteFilter, deleteMany, removeCategory]);

  const hasSearch = Boolean(filters.search?.trim());
  const showClearAll = items.length > 0 || hasSearch;

  if (!showClearAll) return null;

  const onClearAll = () => {
    if (
      filters.lat != null ||
      filters.lng != null ||
      filters.radius_km != null
    ) {
      sessionStorage.setItem(NEAR_ME_SESSION_KEY, "1");
    }
    clearAll();
  };

  return (
    <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-2">
      {items.length > 0 ? (
        <ul
          aria-label="Active filters"
          className="flex min-w-0 flex-1 flex-wrap gap-2"
        >
          {items.map((item) => (
            <li key={item.key}>
              <Button
                type="button"
                variant="badge"
                aria-label={`Remove filter ${item.label}`}
                onClick={item.onRemove}
              >
                <span className="min-w-0 flex-1 text-left line-clamp-2">
                  {item.label}
                </span>
                <span
                  className="pointer-events-none flex size-5 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors group-hover:text-text/90"
                  aria-hidden
                >
                  <X className="size-3" />
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-w-0 flex-1" aria-hidden />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClearAll}
        className={cn(
          "shrink-0 border-2 border-border bg-fg-2/40 text-[11px] font-medium uppercase tracking-widest text-text-muted shadow-none",
          "hover:border-text/35 hover:bg-fg-2 hover:text-text",
        )}
      >
        Clear all
      </Button>
    </div>
  );
}
