"use client";

import type { EnumType } from "@repo/common-lib/constants/enums";
import { MAX_CATEGORIES_USER } from "@repo/common-lib/constants/limits";
import type { CategoryBase } from "@repo/common-lib/types/category";
import type { Pagination } from "@repo/common-lib/types/response";
import { Search } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { getActiveCategoriesAction } from "../server-actions/categories.action";

type OnchangeFilter = {
  searchQuery?: string;
  type?: EnumType<"CATEGORY_TYPE">;
};

type GetCategoriesContextType = {
  /** Present after a successful index fetch; exposes API pagination for "load more". */
  categoriesResponse: { pagination?: Pagination } | null;
  categoriesToDisplay: CategoryBase[];
  categoriesSelected: Map<number, CategoryBase>;
  handleSelectCategory: (category: CategoryBase) => void;
  handleRemoveCategory: (category: CategoryBase) => void;
  isSelected: (category: CategoryBase) => boolean;
  /** Debounced fetch; pass the current input string so search works without relying on input ref timing. */
  handleOnChange: (params: {
    searchQuery?: string;
    type?: EnumType<"CATEGORY_TYPE">;
  }) => void;
  currentFilters: OnchangeFilter;
  /** `handleSelectCategory` already ignores picks past the cap; this is that same state, for the UI. */
  hasReachedMax: boolean;
  isLoading: boolean;
  /** The kinds this picker offers — what the dropdown's type filter chips are built from. */
  types: readonly EnumType<"CATEGORY_TYPE">[];
};

const GetCategoriesContext = createContext<GetCategoriesContextType | null>(
  null,
);

type GetCategoriesProviderProps = {
  children: ReactNode;
  initialCategories: CategoryBase[];
  /** Max categories that can be selected in this provider. Defaults to the profile cap. */
  maxSelections?: number;
  /**
   * Makes the picked set follow this list, for pickers whose value lives elsewhere (several staged
   * uploads at once, a draft that can be discarded). Without it the provider owns the selection,
   * seeded from `initialCategories` once — which is what the portfolio and profile forms want.
   * Picks still go through the combobox's own callbacks either way.
   */
  syncSelected?: CategoryBase[];
  /**
   * Hides every category that is the parent of another, so only the most specific ones can be
   * picked. A parent says nothing the child does not ("Photography" next to "Portrait Photography"),
   * so offering both only invites a redundant pick. Off by default: portfolios and profiles keep
   * the full list.
   */
  leavesOnly?: boolean;
  /**
   * The kinds of category this picker offers. Defaults to disciplines and art styles — what every
   * picker offered before TECHNIQUE existed, so adding a kind does not leak it into portfolios,
   * profiles or onboarding. Only the media picker opts into techniques; TAGS are never pickable.
   */
  types?: readonly EnumType<"CATEGORY_TYPE">[];
};

const DEFAULT_PICKABLE_TYPES = [
  "DISCIPLINE",
  "ART_STYLE",
] as const satisfies readonly EnumType<"CATEGORY_TYPE">[];

export const GetCategoriesProvider = ({
  children,
  initialCategories = [],
  maxSelections = MAX_CATEGORIES_USER,
  syncSelected,
  leavesOnly = false,
  types = DEFAULT_PICKABLE_TYPES,
}: GetCategoriesProviderProps) => {
  const filterMemo = useRef<OnchangeFilter>({});
  const loadedCategories = useRef<CategoryBase[]>([]);

  const [categoriesSelected, setCategoriesSelected] = useState<
    Map<number, CategoryBase>
  >(
    !initialCategories.length
      ? new Map()
      : (() => {
          const map = new Map();
          initialCategories.forEach((cat) => {
            map.set(cat.id, cat);
          });
          return map;
        })(),
  );
  const [categoriesToDisplay, setCategoriesToDisplay] = useState<
    CategoryBase[]
  >([]);

  const {
    handleAction,
    result: categoriesResult,
    isPending: isLoading,
  } = useHandleAction<{ pagination?: Pagination }, CategoryBase[]>({
    action: async () => getActiveCategoriesAction(),
    afterAction: async (result) => {
      if (result.data !== null && result.errors === null) {
        // Computed over the whole list: a parent is a parent whatever its children's type.
        const parentIds = new Set(
          result.data.flatMap((cat) => (cat.parent_id ? [cat.parent_id] : [])),
        );
        loadedCategories.current = result.data.filter(
          (cat) =>
            types.includes(cat.type) && !(leavesOnly && parentIds.has(cat.id)),
        );
        handleOnChange();
      }
    },
  });

  const categoriesResponse = useMemo(() => {
    if (
      !categoriesResult ||
      categoriesResult.errors !== null ||
      categoriesResult.data === null
    ) {
      return null;
    }
    return { pagination: categoriesResult.inputs?.pagination };
  }, [categoriesResult]);

  const handleSelectCategory = (category: CategoryBase) => {
    if (
      categoriesSelected.has(category.id) ||
      categoriesSelected.size >= maxSelections
    )
      return;
    categoriesSelected.set(category.id, category);
    setCategoriesSelected(new Map(categoriesSelected));
    handleOnChange();
  };
  const handleRemoveCategory = (category: CategoryBase) => {
    if (!categoriesSelected.has(category.id)) return;
    categoriesSelected.delete(category.id);
    setCategoriesSelected(new Map(categoriesSelected));
    handleOnChange();
  };
  const isSelected = (category: CategoryBase) => {
    return categoriesSelected.has(category.id);
  };
  const handleOnChange = (filters?: {
    searchQuery?: string;
    type?: EnumType<"CATEGORY_TYPE">;
  }) => {
    const _filter = filters || filterMemo.current;
    filterMemo.current = _filter;
    const { searchQuery, type } = _filter;
    const search = !searchQuery ? "" : searchQuery.toLocaleLowerCase().trim();
    const categoriesFiltered =
      !Search && !type
        ? loadedCategories.current
        : loadedCategories.current.filter(
            ({ id, name, slug, tags, type: _type }, _i) => {
              let searchFilter = true;
              if (search) {
                searchFilter =
                  name.includes(search) ||
                  slug.includes(search) ||
                  tags.includes(search);
              }
              let typeFilter = true;
              if (type) {
                typeFilter = type === _type;
              }
              return searchFilter && typeFilter && !categoriesSelected.has(id);
            },
          );

    setCategoriesToDisplay(categoriesFiltered);
  };

  useEffect(() => {
    if (loadedCategories.current.length) return;
    handleAction();
  }, []);

  // Keyed by ids, not by the array: callers build a fresh list every render, and re-syncing on
  // identity would reset the picker mid-interaction.
  const syncSignature = syncSelected?.map((c) => c.id).join(",");
  useEffect(() => {
    if (syncSelected === undefined) return;
    setCategoriesSelected((prev) =>
      prev.size === syncSelected.length &&
      syncSelected.every((c) => prev.has(c.id))
        ? prev
        : new Map(syncSelected.map((c) => [c.id, c])),
    );
  }, [syncSignature]);

  // The dropdown hides what is already picked, so it has to be refiltered whenever the picked set
  // changes from outside (a sync above) and not only on this provider's own picks.
  useEffect(() => {
    if (!loadedCategories.current.length) return;
    handleOnChange();
  }, [categoriesSelected]);
  const value: GetCategoriesContextType = {
    categoriesResponse,
    categoriesToDisplay,
    categoriesSelected,
    handleSelectCategory,
    handleRemoveCategory,
    isSelected,
    handleOnChange,
    currentFilters: filterMemo.current,
    hasReachedMax: categoriesSelected.size >= maxSelections,
    isLoading,
    types,
  };

  return (
    <GetCategoriesContext.Provider value={value}>
      {children}
    </GetCategoriesContext.Provider>
  );
};

export const useGetCategories = () => {
  const context = useContext(GetCategoriesContext);
  if (!context) {
    throw new Error(
      "useGetCategories must be used within an getCategoriesProvider",
    );
  }
  return context;
};
