"use client";

import type { CategoryBase } from "@repo/common-lib/types/category";
import type { CollectionPortfolio } from "@repo/common-lib/types/collection";
import type { MediaPortfolio } from "@repo/common-lib/types/media";
import type {
  CreatePortfolioInputWithFile,
  FullPortfolio,
  PortfolioFormData,
  PortfolioItem,
} from "@repo/common-lib/types/portfolio";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { buildPortfolioItemsFromFullPortfolio } from "@repo/common-lib/utils/portfolio";
import { toast } from "@repo/ui/sonner";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { UserAuth } from "@/modules/auth/auth.types";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdatePortfolioAction } from "../server-actions/create-update-portfolio.action";
import { slugExistsAction } from "../server-actions/slug-exists.action";

function categoryIdsEqual(a: CategoryBase[], b: CategoryBase[]) {
  const idsA = a
    .map((c) => c.id)
    .sort((x, y) => x - y)
    .join(",");
  const idsB = b
    .map((c) => c.id)
    .sort((x, y) => x - y)
    .join(",");
  return idsA === idsB;
}

type PortfolioContextType = {
  user: UserAuth;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  // `media` is overridden in this provider to be `Media[]` for UI purposes.
  handleSetFormData: (
    key: keyof CreatePortfolioInputWithFile,
    value:
      | string
      | File
      | number
      | boolean
      | MediaPortfolio[]
      | CollectionPortfolio[],
  ) => void;
  handleStep: (direction: "prev" | "next") => void;
  currentStep: number;
  MAX_STEPS: number;
  formData: PortfolioFormData;
  inputErrors: Record<string, string> | undefined;
  isPending: boolean;
  success: boolean;
  canSubmit: boolean;
  canGoNextStep: boolean;
  isSlugAvailable?: boolean;
  isCheckingSlugAvailability: boolean;
  checkSlugAvailability: () => Promise<void>;
  deleteInputErrorProperty: (key: string) => void;
  reset: () => void;
  clear: () => void;
  currentPortfolio: FullPortfolio | undefined;
  setPortfolio: (portfolio: FullPortfolio) => void;
  portfolioItems: PortfolioItem[];
  handleSetPortfolioItems: (items: PortfolioItem[]) => void;
  handleShiftPortfolioItem: (item: Omit<PortfolioItem, "position">) => void;
  handleRemovePortfolioItem: (id: number, kind: PortfolioItem["item"]) => void;
  categoriesSelected: CategoryBase[];
  setCategorySelected: (category: CategoryBase) => void;
  removeCategorySelected: (category: CategoryBase) => void;
};

// ============================================================================
// Context Setup
// ============================================================================

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

type PortfolioProviderProps = {
  children: ReactNode;
  user: UserAuth;
  defaultPortfolio?: FullPortfolio;
};

const MAX_STEPS = 2;
const firstStepRequiredFields: (keyof PortfolioFormData)[] = [
  "user_id",
  "slug",
  "title",
  "thumbnail",
];
export const PortfolioProvider = ({
  children,
  user,
  defaultPortfolio,
}: PortfolioProviderProps) => {
  const [currentPortfolio, setCurrentPorfolio] = useState(defaultPortfolio);
  const initialPortfolioItems = useRef(
    defaultPortfolio
      ? buildPortfolioItemsFromFullPortfolio(defaultPortfolio)
      : [],
  );
  const initialCategories = useRef<CategoryBase[]>(
    (defaultPortfolio?.categories ?? []) as CategoryBase[],
  );
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    initialPortfolioItems.current,
  );
  const [categoriesSelected, setCategoriesSelected] = useState<CategoryBase[]>(
    initialCategories.current,
  );

  const [formData, setFormData] = useState<PortfolioFormData>({
    user_id: user.id,
  });

  const setPortfolio = useCallback((portfolio: FullPortfolio) => {
    setCurrentPorfolio(portfolio);
    const initialItems = buildPortfolioItemsFromFullPortfolio(portfolio);
    initialPortfolioItems.current = initialItems;
    const portfolioCategories = (portfolio.categories ?? []) as CategoryBase[];
    initialCategories.current = portfolioCategories;
    setPortfolioItems(initialItems);
    setCategoriesSelected(portfolioCategories);
    setCurrentStep(1);
    setFormData({
      user_id: portfolio.user_id,
      title: portfolio.title,
      slug: portfolio.slug,
      description: portfolio.description ?? undefined,
      is_highlight: portfolio.is_highlight,
      is_active: portfolio.is_active,
    });
  }, []);

  const setCategorySelected = useCallback((category: CategoryBase) => {
    setCategoriesSelected((prev) => {
      if (prev.some((c) => c.id === category.id)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, category];
    });
  }, []);

  const removeCategorySelected = useCallback((category: CategoryBase) => {
    setCategoriesSelected((prev) => prev.filter((c) => c.id !== category.id));
  }, []);

  const [currentStep, setCurrentStep] = useState(1);

  const idTimeOut = useRef<NodeJS.Timeout>(null);

  const {
    handleAction,
    isPending,
    success,
    deleteInputErrorProperty,
    inputErrors,
    reset,
  } = useHandleAction({
    action: async () => {
      const media: { id: number; position: number }[] = [];
      const collections: { id: number; position: number }[] = [];
      for (let index = 0; index < portfolioItems.length; index++) {
        const { id, item } = portfolioItems[index];
        const obj = {
          id,
          position: index + 1,
        };
        switch (item) {
          case "media":
            media.push(obj);

            break;
          case "collection":
            collections.push(obj);

            break;

          default:
            break;
        }
      }

      const payload: Partial<CreatePortfolioInputWithFile> = {
        title: (formData.title ?? "") as string,
        slug: (formData.slug ?? "") as string,
        description: (formData.description ?? undefined) as string | undefined,
        user_id: (formData.user_id ?? user.id) as number,
        is_highlight: formData.is_highlight ?? false,
        is_active: formData.is_active ?? true,
        thumbnail: formData.thumbnail
          ? (formData.thumbnail as File)
          : undefined,
        media: media.length ? media : undefined,
        collections: collections.length ? collections : undefined,
        categories: categoriesSelected.map((c) => c.id),
      };

      return await createOrUpdatePortfolioAction(payload, currentPortfolio);
    },
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) {
          toast.error(error);
        }
      } else if (result.data) {
        clear();
        toast.success(
          currentPortfolio
            ? "Portfolio updated successfully"
            : "Portfolio created successfully",
        );
      }
    },
    beforeAction: async () => {
      reset();
    },
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await handleAction();
    },
    [handleAction],
  );

  const slugChecksMemo = useRef<
    Record<string, ActionReturn<boolean | null, undefined>>
  >({});
  const {
    handleAction: handleActionSlug,
    result: resultSlugExist,
    isPending: isPendingSlugExists,
    cleanResult,
    cleanErrors,
  } = useHandleAction({
    action: async () => {
      // Normalize slug before checking to match how it's stored in DB (without trailing hyphens)

      const slugToCheck = formData.slug || "";

      if (slugChecksMemo.current[slugToCheck]) {
        return slugChecksMemo.current[slugToCheck];
      }
      return await slugExistsAction(user.username, slugToCheck);
    },
    afterAction: async (data) => {
      slugChecksMemo.current[formData.slug || ""] = data;
    },
  });

  const checkSlugAvailability = useCallback(async () => {
    if (
      !formData?.slug ||
      isPendingSlugExists ||
      formData.slug === currentPortfolio?.slug
    )
      return;
    if (idTimeOut.current) clearTimeout(idTimeOut.current);
    idTimeOut.current = setTimeout(() => {
      cleanResult();
      cleanErrors();
      handleActionSlug();
      if (idTimeOut.current) clearTimeout(idTimeOut.current);
    }, 1000);
  }, [
    formData,
    isPendingSlugExists,
    cleanResult,
    cleanErrors,
    handleActionSlug,
    currentPortfolio?.slug,
  ]);

  const handleSetPortfolioItems = useCallback((items: PortfolioItem[]) => {
    setPortfolioItems(items);
  }, []);

  const handleShiftPortfolioItem = useCallback(
    (item: Omit<PortfolioItem, "position">) => {
      setPortfolioItems((prev) => {
        if (prev.some((x) => x.item === item.item && x.id === item.id))
          return prev;
        const next = { ...item, position: prev.length + 1 } as PortfolioItem;
        return [next, ...prev];
      });
    },
    [],
  );

  const handleRemovePortfolioItem = useCallback(
    (id: number, kind: PortfolioItem["item"]) => {
      setPortfolioItems((prev) =>
        prev.filter((x) => !(x.item === kind && x.id === id)),
      );
    },
    [],
  );

  const handleSetFormData = useCallback(
    (key: keyof CreatePortfolioInputWithFile, value: any) => {
      if (key === "slug") {
        cleanResult();
        cleanErrors();
      }
      setFormData((prev) => {
        if (prev) {
          return {
            ...prev,
            [key]: value,
          };
        }
        return {
          [key]: value,
        };
      });
    },
    [cleanErrors, cleanResult],
  );

  const firstStepIsCompleted = !firstStepRequiredFields.some((field) => {
    if (!formData) return true;
    const hasField = formData[field];
    if (hasField) return false;

    if (field === "thumbnail" && currentPortfolio?.thumbnail) return false;
    return true;
  });

  const hasFormChanged = useMemo(() => {
    if (!currentPortfolio) return false;

    if (formData.title !== currentPortfolio.title) return true;
    if (formData.slug !== currentPortfolio.slug) return true;
    if (
      (formData.description ?? undefined) !==
      (currentPortfolio.description ?? undefined)
    )
      return true;
    if ((formData.is_highlight ?? false) !== currentPortfolio.is_highlight)
      return true;
    if ((formData.is_active ?? true) !== currentPortfolio.is_active)
      return true;
    if (formData.thumbnail) return true;

    if (!categoryIdsEqual(categoriesSelected, initialCategories.current))
      return true;

    const baselineItems = initialPortfolioItems.current;
    if (baselineItems.length !== portfolioItems.length) return true;
    for (let i = 0; i < portfolioItems.length; i++) {
      const a = portfolioItems[i];
      const b = baselineItems[i];
      if (a.item !== b.item || a.id !== b.id) return true;
    }

    return false;
  }, [formData, currentPortfolio, portfolioItems, categoriesSelected]);

  const canGoNextStep = useMemo(() => {
    const nextStep = currentStep + 1;
    if (nextStep > MAX_STEPS) return false;
    if (nextStep === 2) {
      return firstStepIsCompleted;
    }

    return false;
  }, [currentStep, firstStepIsCompleted]);

  const canSubmit = useMemo(() => {
    if (!firstStepIsCompleted || !portfolioItems.length) return false;

    if (currentPortfolio) return hasFormChanged;

    return currentStep === MAX_STEPS;
  }, [
    currentStep,
    currentPortfolio,
    hasFormChanged,
    firstStepIsCompleted,
    portfolioItems.length,
  ]);

  const handleStep = (direction: "prev" | "next") => {
    if (direction === "prev" && currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (direction === "next" && canGoNextStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const clear = useCallback(() => {
    // Reset local state
    setFormData({ user_id: user.id });
    setCurrentStep(1);
    setCurrentPorfolio(undefined);
    setPortfolioItems([]);
    initialCategories.current = [];
    setCategoriesSelected([]);
    // Reset action state (errors/result)
    reset();
    cleanErrors();
    cleanResult();

    // Clear slug memo + pending timeout
    slugChecksMemo.current = {};
    if (idTimeOut.current) {
      clearTimeout(idTimeOut.current);
      idTimeOut.current = null;
    }
  }, [user, reset, cleanErrors, cleanResult]);

  const contextValue: PortfolioContextType = {
    user,
    handleSubmit,
    handleSetFormData,
    handleStep,
    currentStep,
    MAX_STEPS,
    formData,
    inputErrors,
    isPending,
    success,
    canGoNextStep,
    canSubmit,
    isSlugAvailable:
      typeof resultSlugExist?.data === "boolean"
        ? !resultSlugExist.data
        : undefined,
    isCheckingSlugAvailability: isPendingSlugExists,
    checkSlugAvailability,
    deleteInputErrorProperty,
    reset,
    clear,
    currentPortfolio,
    setPortfolio,
    portfolioItems,
    handleSetPortfolioItems,
    handleShiftPortfolioItem,
    handleRemovePortfolioItem,
    categoriesSelected,
    setCategorySelected,
    removeCategorySelected,
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
};
