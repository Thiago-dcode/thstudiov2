"use client";

import { SQL_ORDER_DIRECTIONS } from "@repo/common-lib/constants/database";
import { ENUMS } from "@repo/common-lib/constants/enums";
import { MEDIA_ORDER_BY_COLUMNS } from "@repo/common-lib/constants/media";
import type { SqlOrderDirection } from "@repo/common-lib/types/database";
import type { MediaOrderBy } from "@repo/common-lib/types/media";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Select } from "@repo/ui/components/shadcn/select";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import {
  MEDIA_PATH,
  type MediaListQuery,
  type MediaShapeFilter,
  type MediaTypeFilter,
  mediaListQueryParams,
  parseMediaListQuery,
} from "../media.params";

/** Every column in both directions, so each option reads as one complete choice. */
const SORT_OPTIONS = MEDIA_ORDER_BY_COLUMNS.flatMap((orderBy) =>
  [...SQL_ORDER_DIRECTIONS]
    .reverse()
    .map((order) => ({ orderBy, order, value: `${orderBy}:${order}` })),
);

const selectClass = "h-9 text-xs! w-full";

export function MediaSearch() {
  const t = useTranslations("atelier.media.search");
  const tMedia = useTranslations("atelier.media");
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = parseMediaListQuery((key) => searchParams.get(key));
  const [value, setValue] = useState(current.search ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  const navigate = (overrides: Partial<MediaListQuery>) => {
    const params = mediaListQueryParams({ ...current, ...overrides });
    startTransition(() => {
      router.push(queryParamBuilder(MEDIA_PATH, params));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: value.trim() || undefined });
  };

  const handleClearSearch = () => {
    setValue("");
    navigate({ search: undefined });
  };

  const handleClearFilters = () => {
    setValue("");
    navigate({ search: undefined, shape: undefined, media_type: undefined });
  };

  const handleSortChange = (sort: string) => {
    const option = SORT_OPTIONS.find((o) => o.value === sort);
    if (option) navigate({ order_by: option.orderBy, order: option.order });
  };

  const hasActiveFilters = Boolean(
    current.search || current.shape || current.media_type,
  );

  return (
    <div className="flex w-full flex-col gap-2 tablet:w-md">
      <form onSubmit={handleSubmit} className="relative w-full" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 z-30 size-3.5 -translate-y-1/2 text-text-muted" />
        <Input
          type="search"
          aria-label={t("placeholder")}
          placeholder={t("placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 pl-8 text-xs! [&::-webkit-search-cancel-button]:hidden"
          disabled={isPending}
        />
        {value && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label={t("clearSearch")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {/* Filters narrow the library; sort only reorders it — so they sit apart. */}
      <div className="grid grid-cols-2 gap-1.5 tablet:grid-cols-[1fr_1fr_1.4fr]">
        <Select
          aria-label={t("shapeGroupLabel")}
          value={current.shape ?? ""}
          disabled={isPending}
          onChange={(e) =>
            navigate({
              shape: (e.target.value || undefined) as
                | MediaShapeFilter
                | undefined,
            })
          }
          className={selectClass}
        >
          <option value="">{t("allShapes")}</option>
          {ENUMS.MEDIA_SHAPE.map((shape) => (
            <option key={shape} value={shape}>
              {t(`shape.${shape}`)}
            </option>
          ))}
        </Select>

        <Select
          aria-label={t("typeGroupLabel")}
          value={current.media_type ?? ""}
          disabled={isPending}
          onChange={(e) =>
            navigate({
              media_type: (e.target.value || undefined) as
                | MediaTypeFilter
                | undefined,
            })
          }
          className={selectClass}
        >
          <option value="">{t("allTypes")}</option>
          {ENUMS.MEDIA_TYPE.map((mediaType) => (
            <option key={mediaType} value={mediaType}>
              {tMedia(`mediaType.${mediaType}`)}
            </option>
          ))}
        </Select>

        <Select
          aria-label={t("sortLabel")}
          value={`${current.order_by}:${current.order}`}
          disabled={isPending}
          onChange={(e) => handleSortChange(e.target.value)}
          className={`${selectClass} col-span-2 tablet:col-span-1`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`sort.${sortKey(option.orderBy, option.order)}`)}
            </option>
          ))}
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleClearFilters}
          disabled={isPending}
          className="h-7 self-start px-2 text-[11px] font-medium text-text-muted hover:bg-fg-2 hover:text-text"
        >
          <X className="size-3" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}

function sortKey(orderBy: MediaOrderBy, order: SqlOrderDirection) {
  return `${orderBy}_${order.toLowerCase() as Lowercase<SqlOrderDirection>}` as const;
}
