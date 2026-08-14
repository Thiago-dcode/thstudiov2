"use client";

import { MAX_CATEGORIES_USER } from "@repo/common-lib/constants/constants";
import type { EnumType } from "@repo/common-lib/constants/enums";
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
};

const GetCategoriesContext = createContext<GetCategoriesContextType | null>(
  null,
);

type GetCategoriesProviderProps = {
  children: ReactNode;
  initialCategories: CategoryBase[];
  /** Max categories that can be selected in this provider. Defaults to the profile cap. */
  maxSelections?: number;
};

export const GetCategoriesProvider = ({
  children,
  initialCategories = [],
  maxSelections = MAX_CATEGORIES_USER,
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
        loadedCategories.current = result.data;
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
