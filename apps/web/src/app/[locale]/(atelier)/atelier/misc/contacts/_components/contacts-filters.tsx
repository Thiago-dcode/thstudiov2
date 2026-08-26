"use client";

import { SQL_ORDER_DIRECTIONS } from "@repo/common-lib/constants/database";
import {
  DEFAULT_USER_CONTACT_ORDER_BY,
  USER_CONTACT_ORDER_BY_COLUMNS,
} from "@repo/common-lib/constants/user-contact";
import type { SqlOrderDirection } from "@repo/common-lib/types/database";
import type { UserContactOrderBy } from "@repo/common-lib/types/user-contact";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Select } from "@repo/ui/components/shadcn/select";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { CONTACTS_PATH } from "../contacts.params";

type Overrides = {
  search?: string;
  order_by?: UserContactOrderBy;
  order?: SqlOrderDirection;
};

function parseOrderBy(value: string | null): UserContactOrderBy {
  return USER_CONTACT_ORDER_BY_COLUMNS.includes(value as UserContactOrderBy)
    ? (value as UserContactOrderBy)
    : DEFAULT_USER_CONTACT_ORDER_BY;
}

function parseOrder(value: string | null): SqlOrderDirection {
  const upper = value?.toUpperCase();
  return SQL_ORDER_DIRECTIONS.includes(upper as SqlOrderDirection)
    ? (upper as SqlOrderDirection)
    : "DESC";
}

/**
 * Builds the next query string from the current one plus overrides. `page` is deliberately dropped:
 * any filter or sort change invalidates the offset, so navigation always restarts at page 1.
 */
function buildContactsQueryParams(
  searchParams: URLSearchParams,
  overrides: Overrides = {},
) {
  const params: Record<string, string> = {};

  const search =
    overrides.search !== undefined
      ? overrides.search.trim()
      : (searchParams.get("search") ?? "").trim();
  if (search) params.search = search;

  const orderBy =
    overrides.order_by ?? parseOrderBy(searchParams.get("order_by"));
  if (orderBy !== DEFAULT_USER_CONTACT_ORDER_BY) params.order_by = orderBy;

  const order = overrides.order ?? parseOrder(searchParams.get("order"));
  if (order !== "DESC") params.order = order;

  const perPage = searchParams.get("per_page");
  if (perPage) params.per_page = perPage;

  return params;
}

export function ContactsFilters() {
  const t = useTranslations("atelier.contacts.filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrderBy = parseOrderBy(searchParams.get("order_by"));
  const currentOrder = parseOrder(searchParams.get("order"));
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  const navigate = (overrides: Overrides = {}) => {
    const params = buildContactsQueryParams(searchParams, overrides);
    startTransition(() => {
      router.push(queryParamBuilder(CONTACTS_PATH, params));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: value });
  };

  const handleClearSearch = () => {
    setValue("");
    navigate({ search: "" });
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full tablet:max-w-md">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none z-30" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-8 h-9 text-xs!"
          disabled={isPending}
        />
        {value && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label={t("clearSearchAria")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      <div className="flex items-center gap-1.5 w-full">
        <Select
          aria-label={t("orderByAria")}
          value={currentOrderBy}
          disabled={isPending}
          onChange={(e) =>
            navigate({ order_by: e.target.value as UserContactOrderBy })
          }
          className="h-9 text-xs! flex-1"
        >
          {USER_CONTACT_ORDER_BY_COLUMNS.map((column) => (
            <option key={column} value={column}>
              {t(`orderByOptions.${column}`)}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 hover:bg-fg-2"
          disabled={isPending}
          aria-label={currentOrder === "DESC" ? t("sortDesc") : t("sortAsc")}
          title={currentOrder === "DESC" ? t("sortDesc") : t("sortAsc")}
          onClick={() =>
            navigate({ order: currentOrder === "DESC" ? "ASC" : "DESC" })
          }
        >
          {currentOrder === "DESC" ? (
            <ArrowDownWideNarrow className="size-4" />
          ) : (
            <ArrowUpNarrowWide className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
