"use client";

import type { CategoryBase } from "@repo/common-lib/types/category";
import type { ArtistIndexRequest } from "@repo/common-lib/types/user";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "@/i18n/navigation";
import { filtersToQuery, type SearchSegment } from "./search.utils";

type FiltersContextValue = {
  segment: SearchSegment;
  filters: ArtistIndexRequest;
  /** Parsed request from the current page URL; updates when the server passes new `params`. */
  urlParams: ArtistIndexRequest;

  categoriesSelected: CategoryBase[];
  /** Replace the full category selection; updates `filters.categories`. */
  setCategoriesSelected: (categories: CategoryBase[]) => void;
  /** Append a category if not already selected; updates `filters.categories`. */
  pushCategory: (category: CategoryBase) => void;
  /** Remove a category by slug; clears `categories` when none remain. */
  removeCategory: (slug: string) => void;
  /** Set a single filter key to the given value. */
  add: <K extends keyof ArtistIndexRequest>(
    key: K,
    value: ArtistIndexRequest[K],
  ) => void;
  /** Set multiple filter keys in a single update. */
  addMany: (entries: Partial<ArtistIndexRequest>) => void;
  /** Drop a single filter key. */
  delete: (key: keyof ArtistIndexRequest) => void;
  /** Drop multiple filter keys in a single update. */
  deleteMany: (keys: (keyof ArtistIndexRequest)[]) => void;
  /** Reset all filters. */
  clearAll: () => void;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

export const useFilters = () => {
  const ctx = use(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return ctx;
};

type FiltersProviderProps = {
  children: ReactNode;
  segment: SearchSegment;
  params: ArtistIndexRequest;
  defaultCategoriesSelected?: CategoryBase[];
};

/** Strip `page` so any filter change sends the user back to page 1. */
function withoutPage<T extends ArtistIndexRequest>(filters: T): T {
  const { page: _p, ...rest } = filters;
  return rest as T;
}

export function FiltersProvider({
  children,
  segment,
  params: initialParams,
  defaultCategoriesSelected = [],
}: FiltersProviderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState<ArtistIndexRequest>(initialParams);
  const filtersRef = useRef<ArtistIndexRequest>(initialParams);

  const [categoriesSelected, setCategoriesSelectedState] = useState<
    CategoryBase[]
  >(defaultCategoriesSelected);
  /** Keep client filter state aligned with URL/searchParams when the server passes new `params`. */
  useEffect(() => {
    filtersRef.current = initialParams;
    setFilters(initialParams);
  }, [initialParams]);

  const urlFor = useCallback(
    (next: ArtistIndexRequest) =>
      queryParamBuilder(`/${segment}`, filtersToQuery(next), {
        arrayStyle: "commas",
      }),
    [segment],
  );

  const commitFilters = useCallback(
    (next: ArtistIndexRequest) => {
      filtersRef.current = next;
      setFilters(next);
      startTransition(() => {
        router.push(urlFor(next));
      });
    },
    [router, urlFor],
  );

  const add = useCallback(
    <K extends keyof ArtistIndexRequest>(
      key: K,
      value: ArtistIndexRequest[K],
    ) => {
      const next = { ...filtersRef.current, [key]: value };
      // Geo-location and address filters are mutually exclusive.
      if (key === "lat" || key === "lng" || key === "radius_km") {
        delete next.city;
        delete next.state;
        delete next.country;
      } else if (key === "city" || key === "state" || key === "country") {
        delete next.lat;
        delete next.lng;
        delete next.radius_km;
      }
      // Reset pagination unless the caller is explicitly setting the page.
      commitFilters(key === "page" ? next : withoutPage(next));
    },
    [commitFilters],
  );

  const addMany = useCallback(
    (entries: Partial<ArtistIndexRequest>) => {
      const next = { ...filtersRef.current, ...entries };
      const keys = Object.keys(entries) as (keyof ArtistIndexRequest)[];
      const hasGeo = keys.some(
        (k) => k === "lat" || k === "lng" || k === "radius_km",
      );
      const hasAddress = keys.some(
        (k) => k === "city" || k === "state" || k === "country",
      );
      if (hasGeo) {
        delete next.city;
        delete next.state;
        delete next.country;
      }
      if (hasAddress) {
        delete next.lat;
        delete next.lng;
        delete next.radius_km;
      }
      commitFilters(withoutPage(next));
    },
    [commitFilters],
  );

  const deleteFilter = useCallback(
    (key: keyof ArtistIndexRequest) => {
      const next = { ...filtersRef.current };
      delete next[key];
      commitFilters(key === "page" ? next : withoutPage(next));
    },
    [commitFilters],
  );

  const deleteMany = useCallback(
    (keys: (keyof ArtistIndexRequest)[]) => {
      const next = { ...filtersRef.current };
      for (const key of keys) delete next[key];
      commitFilters(withoutPage(next));
    },
    [commitFilters],
  );

  const clearAll = useCallback(() => {
    setCategoriesSelectedState([]);
    commitFilters({});
  }, [commitFilters]);

  const setCategoriesSelected = useCallback(
    (categories: CategoryBase[]) => {
      setCategoriesSelectedState(categories);
      const slugs = categories.map((c) => c.slug);
      const next =
        slugs.length === 0
          ? (({ categories: _c, ...rest }) => rest)(filtersRef.current)
          : { ...filtersRef.current, categories: slugs };
      commitFilters(withoutPage(next));
    },
    [commitFilters],
  );

  const pushCategory = useCallback(
    (category: CategoryBase) => {
      const slugs = filtersRef.current.categories ?? [];
      if (slugs.includes(category.slug)) return;
      setCategoriesSelectedState((prev) =>
        prev.some((c) => c.id === category.id) ? prev : [...prev, category],
      );
      commitFilters(
        withoutPage({
          ...filtersRef.current,
          categories: [...slugs, category.slug],
        }),
      );
    },
    [commitFilters],
  );

  const removeCategory = useCallback(
    (slug: string) => {
      setCategoriesSelectedState((prev) => prev.filter((c) => c.slug !== slug));
      const slugs = filtersRef.current.categories ?? [];
      const next = slugs.filter((s) => s !== slug);
      const base =
        next.length === 0
          ? (({ categories: _c, ...rest }) => rest)(filtersRef.current)
          : { ...filtersRef.current, categories: next };
      commitFilters(withoutPage(base));
    },
    [commitFilters],
  );

  const value = useMemo<FiltersContextValue>(
    () => ({
      segment,
      filters,
      urlParams: initialParams,
      categoriesSelected,
      setCategoriesSelected,
      pushCategory,
      removeCategory,
      add,
      addMany,
      delete: deleteFilter,
      deleteMany,
      clearAll,
    }),
    [
      segment,
      filters,
      initialParams,
      categoriesSelected,
      setCategoriesSelected,
      pushCategory,
      removeCategory,
      add,
      addMany,
      deleteFilter,
      deleteMany,
      clearAll,
    ],
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}
