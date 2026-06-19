"use client";

import type { ArtistIndexRequest } from "@repo/common-lib/types/user";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { cn } from "@repo/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  filtersToQuery,
  SEARCH_SEGMENTS,
  type SearchSegment,
} from "./search.utils";

export function SearchSegmentToggle({
  active,
  filters,
}: {
  active: SearchSegment;
  filters: ArtistIndexRequest;
}) {
  return (
    <nav aria-label="Search type" className="flex gap-1 bg-fg-2 p-1">
      {SEARCH_SEGMENTS.map(({ value, label }) => {
        const isActive = active === value;
        const { page: _, ...filtersWithoutPage } = filters;
        const href = queryParamBuilder(
          `/${value}`,
          filtersToQuery(filtersWithoutPage),
          { arrayStyle: "commas" },
        );

        return (
          <Link
            key={value}
            href={href}
            className={cn(
              " px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-bg text-text shadow-sm"
                : "text-text-muted hover:text-text",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
