"use client";

import type {
  CategoryBase,
  CategoryIndexRequest,
} from "@repo/common-lib/types/category";
import type { Pagination } from "@repo/common-lib/types/response";
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
import { getAllCategoriesAction } from "../server-actions/categories.action";

type UpdateCategoriesContextType = {
  /** Present after a successful index fetch; exposes API pagination for "load more". */
  categoriesResponse: { pagination?: Pagination } | null;
  categories: CategoryBase[];
  categoriesSelected: CategoryBase[];
  handleSelectCategory: (category: CategoryBase) => void;
  isSelected: (category: CategoryBase) => boolean;
  /** Debounced fetch; pass the current input string so search works without relying on input ref timing. */
  handleOnChange: (searchQuery?: string) => void;
  handleFetch: (params: CategoryIndexRequest) => Promise<void>;
  searchRef: React.RefObject<HTMLInputElement | null>;
  currentRequest: React.RefObject<CategoryIndexRequest>;
  isLoading: boolean;
};

const UpdateCategoriesContext =
  createContext<UpdateCategoriesContextType | null>(null);

type UpdateCategoriesProviderProps = {
  children: ReactNode;
  userCategories: CategoryBase[];
};

export const UpdateCategoriesProvider = ({
  children,
  userCategories,
}: UpdateCategoriesProviderProps) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const currentRequest = useRef<CategoryIndexRequest>({
    random: true,
  });
  const fetchParamsRef = useRef<CategoryIndexRequest>(currentRequest.current);
  const idTimeOut = useRef<NodeJS.Timeout>(null);
  const [categoriesSelected, setCategoriesSelected] = useState<{
    [id: number]: CategoryBase;
  }>(
    userCategories.reduce(
      (acc, current) => {
        acc[current.id] = current;
        return acc;
      },
      {} as { [id: number]: CategoryBase },
    ),
  );
  const [categories, setCategories] = useState<{
    [id: number]: CategoryBase;
  }>({});
  const categoriesValue = useMemo(() => {
    const list = Object.values(categories);
    const selectedIds = new Set(
      Object.keys(categoriesSelected).map((id) => Number(id)),
    );
    return [...list].sort((a, b) => {
      const aSel = selectedIds.has(a.id);
      const bSel = selectedIds.has(b.id);
      if (aSel === bSel) return 0;
      return aSel ? -1 : 1;
    });
  }, [categories, categoriesSelected]);
  const categoriesSelectedValue = useMemo(
    () => Object.values(categoriesSelected),
    [categoriesSelected],
  );

  const userCategoriesIdsKey = useMemo(
    () =>
      userCategories
        .map((c) => c.id)
        .sort((a, b) => a - b)
        .join(","),
    [userCategories],
  );

  /** When URL / server `userCategories` changes (navigation), align selection. */
  useEffect(() => {
    setCategoriesSelected(
      userCategories.reduce(
        (acc, current) => {
          acc[current.id] = current;
          return acc;
        },
        {} as { [id: number]: CategoryBase },
      ),
    );
  }, [userCategoriesIdsKey]);

  const {
    handleAction: runCategoriesFetch,
    result: categoriesResult,
    isPending: isLoading,
    reset: resetCategoriesAction,
  } = useHandleAction<{ pagination?: Pagination }, CategoryBase[]>({
    action: async () => getAllCategoriesAction(fetchParamsRef.current),
    afterAction: async (result) => {
      if (result.data !== null && result.errors === null) {
        setCategories((prev) => {
          const newCategories = result.data?.reduce(
            (acc, current) => {
              acc[current.id] = current;
              return acc;
            },
            {} as { [id: number]: CategoryBase },
          );
          return { ...prev, ...newCategories };
        });
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

  const handleFetch = async (params: CategoryIndexRequest) => {
    fetchParamsRef.current = params;
    await runCategoriesFetch();
  };

  useEffect(() => {
    fetchParamsRef.current = currentRequest.current;
    void runCategoriesFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only; params are read from refs at call time
  }, [runCategoriesFetch]);

  const handleSelectCategory = (category: CategoryBase) => {
    setCategoriesSelected((prev) => {
      if (prev[category.id]) {
        const { [category.id]: _, ...rest } = prev;
        return rest;
      } else {
        if (categoriesSelectedValue.length >= 5) return prev;
        return { ...prev, [category.id]: category };
      }
    });
  };
  const isSelected = (category: CategoryBase) => {
    return !!categoriesSelected[category.id];
  };
  const handleOnChange = (searchQuery?: string) => {
    if (isLoading) return;
    if (idTimeOut.current) clearTimeout(idTimeOut.current);
    idTimeOut.current = setTimeout(() => {
      resetCategoriesAction();
      if (categoriesValue.length) setCategories({});
      const search =
        searchQuery !== undefined
          ? searchQuery.trim()
          : (searchRef.current?.value ?? "").trim();
      currentRequest.current.page = 1;
      currentRequest.current.random = !search;
      currentRequest.current.search = search || undefined;
      void handleFetch(currentRequest.current);
      if (idTimeOut.current) clearTimeout(idTimeOut.current);
    }, 400);
  };

  const value: UpdateCategoriesContextType = {
    categoriesResponse,
    categories: categoriesValue,
    categoriesSelected: categoriesSelectedValue,
    handleSelectCategory,
    isSelected,
    handleOnChange,
    handleFetch,
    searchRef,
    currentRequest,
    isLoading,
  };

  return (
    <UpdateCategoriesContext.Provider value={value}>
      {children}
    </UpdateCategoriesContext.Provider>
  );
};

export const useUpdateCategories = () => {
  const context = useContext(UpdateCategoriesContext);
  if (!context) {
    throw new Error(
      "useUpdateCategories must be used within an UpdateCategoriesProvider",
    );
  }
  return context;
};
