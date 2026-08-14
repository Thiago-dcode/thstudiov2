"use client";

import {
  MAX_DISCIPLINES_PORTFOLIO,
  MAX_PORTFOLIO_ITEMS,
  MAX_STYLES_PORTFOLIO,
} from "@repo/common-lib/constants/constants";
import { MAX_HIGHLIGHT_PORTFOLIOS } from "@repo/common-lib/constants/highlights";
import type { CategoryBase } from "@repo/common-lib/types/category";
import type { CollectionPortfolio } from "@repo/common-lib/types/collection";
import type { PortfolioLayoutInput } from "@repo/common-lib/types/layout";
import type { MediaPortfolio } from "@repo/common-lib/types/media";
import type {
  CreatePortfolioInputWithFile,
  CreatePortfolioPayload,
  FullPortfolio,
  Portfolio,
  PortfolioInput,
  PortfolioItem,
} from "@repo/common-lib/types/portfolio";
import type { ActionReturn } from "@repo/common-lib/types/response";
import {
  buildPortfolioItemsFromFullPortfolio,
  countPortfolioItemSlot,
  countPortfolioItemSlots,
} from "@repo/common-lib/utils/portfolio";
import { toast } from "@repo/ui/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toastErrorThrottled } from "@/lib/utils/throttled-toast";
import type { UserAuth } from "@/modules/auth/auth.types";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdatePortfolioAction } from "../server-actions/create-update-portfolio.action";
import { getPortfolioHighlightCountAction } from "../server-actions/get-highlight-count.action";

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

function layoutInputFromFullPortfolio(
  portfolio: FullPortfolio | undefined,
): PortfolioLayoutInput | undefined {
  if (!portfolio?.layout?.layout_id) return undefined;

  return {
    layout_id: portfolio.layout.layout_id,
    config: portfolio.layout.config,
  };
}

function layoutInputsEqual(
  a: PortfolioLayoutInput | undefined,
  b: PortfolioLayoutInput | undefined,
) {
  if (a === b) return true;
  if (!a || !b) return !a && !b;
  if (a.layout_id !== b.layout_id) return false;
  return JSON.stringify(a.config ?? null) === JSON.stringify(b.config ?? null);
}

/** Builds the single-source-of-truth input from an existing portfolio (edit) or an empty draft (create). */
function buildPortfolioInput(
  user: UserAuth,
  portfolio?: FullPortfolio,
): PortfolioInput {
  if (!portfolio) {
    return {
      user_id: user.id,
      portfolioItems: [],
      categories: [],
      currentStep: 1,
    };
  }

  return {
    user_id: portfolio.user_id,
    title: portfolio.title,
    description: portfolio.description ?? "",
    is_highlight: portfolio.is_highlight,
    is_active: portfolio.is_active,
    blocked_at: portfolio.blocked_at,
    portfolioItems: buildPortfolioItemsFromFullPortfolio(portfolio),
    categories: (portfolio.categories ?? []) as CategoryBase[],
    layout: layoutInputFromFullPortfolio(portfolio),
    currentStep: 1,
  };
}

type PortfolioContextType = {
  user: UserAuth;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  /** Submits the portfolio without requiring a form submit event (e.g. from a confirmation dialog). */
  submitPortfolio: () => Promise<void>;
  /** Updates a single scalar field on `portfolioInput`. */
  handleSetFormData: (
    key: keyof CreatePortfolioInputWithFile,
    value:
      | string
      | File
      | number
      | boolean
      | MediaPortfolio[]
      | CollectionPortfolio[]
      | PortfolioLayoutInput,
  ) => void;
  handleStep: (direction: "prev" | "next") => void;
  currentStep: number;
  MAX_STEPS: number;
  /** Single source of truth for the whole create/update form. */
  portfolioInput: PortfolioInput;
  setPortfolioInput: Dispatch<SetStateAction<PortfolioInput>>;
  inputErrors: Record<string, string> | undefined;
  isPending: boolean;
  success: boolean;
  portfolioResult: ActionReturn<
    Portfolio | null,
    Partial<CreatePortfolioInputWithFile>
  > | null;
  canSubmit: boolean;
  canGoNextStep: boolean;
  /**
   * `false` during SSR and the initial client render, `true` after mount.
   * Consumers gate hydration-sensitive UI (e.g. button `disabled` state that
   * depends on effect-populated provider state) to avoid hydration mismatches.
   */
  isHydrated: boolean;
  deleteInputErrorProperty: (key: string) => void;
  reset: () => void;
  clear: () => void;
  currentPortfolio: FullPortfolio | undefined;
  setPortfolio: (portfolio: FullPortfolio) => void;
  portfolioItemCount: number;
  portfolioItemLimit: number;
  isPortfolioItemsLimitReached: boolean;
  handleSetPortfolioItems: (items: PortfolioItem[]) => void;
  handleShiftPortfolioItem: (item: Omit<PortfolioItem, "position">) => void;
  handleRemovePortfolioItem: (id: number, kind: PortfolioItem["item"]) => void;
  setCategorySelected: (category: CategoryBase) => void;
  removeCategorySelected: (category: CategoryBase) => void;
  setLayout: (layout: PortfolioLayoutInput) => void;
  highlightCount: number;
  highlightLimit: number;
  isLoadingHighlightCount: boolean;
  fetchHighlightCount: (options?: { force?: boolean }) => Promise<void>;
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
const firstStepRequiredFields: (keyof PortfolioInput)[] = [
  "user_id",
  "title",
  "thumbnail",
];
export const PortfolioProvider = ({
  children,
  user,
  defaultPortfolio,
}: PortfolioProviderProps) => {
  const router = useRouter();
  const t = useTranslations();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [currentPortfolio, setCurrentPorfolio] = useState(defaultPortfolio);

  const initialPortfolioInput = useRef<PortfolioInput>(
    buildPortfolioInput(user, defaultPortfolio),
  );
  const [portfolioInput, setPortfolioInput] = useState<PortfolioInput>(
    initialPortfolioInput.current,
  );

  const currentStep = portfolioInput.currentStep;

  const setPortfolio = useCallback(
    (portfolio: FullPortfolio) => {
      setCurrentPorfolio(portfolio);
      initialPortfolioInput.current = buildPortfolioInput(user, portfolio);
      setPortfolioInput(initialPortfolioInput.current);
    },
    [user],
  );

  const setCategorySelected = useCallback(
    (category: CategoryBase) => {
      setPortfolioInput((prev) => {
        if (prev.categories.some((c) => c.id === category.id)) return prev;
        const max =
          category.type === "ART_STYLE"
            ? MAX_STYLES_PORTFOLIO
            : MAX_DISCIPLINES_PORTFOLIO;
        const sameTypeCount = prev.categories.filter(
          (c) => c.type === category.type,
        ).length;
        if (sameTypeCount >= max) {
          toast.error(t("validation.maxCategories", { max }));
          return prev;
        }
        return { ...prev, categories: [...prev.categories, category] };
      });
    },
    [t],
  );

  const removeCategorySelected = useCallback((category: CategoryBase) => {
    setPortfolioInput((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== category.id),
    }));
  }, []);

  const setLayout = useCallback((layout: PortfolioLayoutInput) => {
    setPortfolioInput((prev) => ({ ...prev, layout }));
  }, []);

  const highlightCountMemo = useRef<ActionReturn<
    number | null,
    undefined
  > | null>(null);
  const forceHighlightFetchRef = useRef(false);
  const highlightLimit = MAX_HIGHLIGHT_PORTFOLIOS;

  const {
    handleAction: handleHighlightCountAction,
    result: highlightCountResult,
    isPending: isLoadingHighlightCount,
    cleanResult: cleanHighlightResult,
  } = useHandleAction({
    action: async () => {
      if (highlightCountMemo.current && !forceHighlightFetchRef.current) {
        return highlightCountMemo.current;
      }
      forceHighlightFetchRef.current = false;
      return await getPortfolioHighlightCountAction();
    },
    afterAction: async (data) => {
      highlightCountMemo.current = data;
    },
  });

  const fetchHighlightCount = useCallback(
    async (options?: { force?: boolean }) => {
      if (options?.force) {
        highlightCountMemo.current = null;
        forceHighlightFetchRef.current = true;
        cleanHighlightResult();
      }
      await handleHighlightCountAction();
    },
    [handleHighlightCountAction, cleanHighlightResult],
  );

  const highlightCount = highlightCountResult?.data ?? 0;

  const {
    result: portfolioResult,
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
      const items = portfolioInput.portfolioItems;
      for (let index = 0; index < items.length; index++) {
        const { id, item } = items[index];
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

      const payload: Partial<CreatePortfolioPayload> = {
        title: (portfolioInput.title ?? "") as string,
        description: (portfolioInput.description ?? "") as string,
        user_id: (portfolioInput.user_id ?? user.id) as number,
        is_highlight: portfolioInput.is_highlight ?? false,
        is_active: portfolioInput.is_active ?? true,
        thumbnail:
          portfolioInput.thumbnail instanceof File
            ? portfolioInput.thumbnail
            : undefined,
        media: media.length ? media : undefined,
        collections: collections.length ? collections : undefined,
        categories: portfolioInput.categories.map((c) => c.id),
        layout: portfolioInput.layout,
      };

      return await createOrUpdatePortfolioAction(payload, currentPortfolio);
    },
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) {
          toast.error(error);
        }
      } else if (result.data) {
        await fetchHighlightCount({ force: true });
        if (currentPortfolio) {
          // Update: keep the just-saved values on screen and revalidate the
          // server-rendered `defaultPortfolio` instead of clearing to a draft.
          router.refresh();
        } else {
          clear();
        }
        toast.success(
          currentPortfolio
            ? t("portfolios.toastUpdated")
            : t("portfolios.toastCreated"),
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

  const submitPortfolio = useCallback(async () => {
    await handleAction();
  }, [handleAction]);

  const handleSetPortfolioItems = useCallback((items: PortfolioItem[]) => {
    setPortfolioInput((prev) => ({ ...prev, portfolioItems: items }));
  }, []);

  const handleShiftPortfolioItem = useCallback(
    (item: Omit<PortfolioItem, "position">) => {
      setPortfolioInput((prev) => {
        const prevItems = prev.portfolioItems;
        if (prevItems.some((x) => x.item === item.item && x.id === item.id)) {
          return prev;
        }

        const currentCount = countPortfolioItemSlots(prevItems);
        const additionalCount = countPortfolioItemSlot(item);

        if (currentCount + additionalCount > MAX_PORTFOLIO_ITEMS) {
          toastErrorThrottled(
            t("validation.maxPortfolioItems", { max: MAX_PORTFOLIO_ITEMS }),
          );
          return prev;
        }

        const next = {
          ...item,
          position: prevItems.length + 1,
        } as PortfolioItem;
        return { ...prev, portfolioItems: [next, ...prevItems] };
      });
    },
    [t],
  );

  const portfolioItemCount = useMemo(
    () => countPortfolioItemSlots(portfolioInput.portfolioItems),
    [portfolioInput.portfolioItems],
  );

  const isPortfolioItemsLimitReached =
    portfolioItemCount >= MAX_PORTFOLIO_ITEMS;

  const handleRemovePortfolioItem = useCallback(
    (id: number, kind: PortfolioItem["item"]) => {
      setPortfolioInput((prev) => ({
        ...prev,
        portfolioItems: prev.portfolioItems.filter(
          (x) => !(x.item === kind && x.id === id),
        ),
      }));
    },
    [],
  );

  const handleSetFormData = useCallback(
    (key: keyof CreatePortfolioInputWithFile, value: any) => {
      setPortfolioInput((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const firstStepIsCompleted = !firstStepRequiredFields.some((field) => {
    const hasField = portfolioInput[field];
    if (hasField) return false;

    if (field === "thumbnail" && currentPortfolio?.thumbnail) return false;
    return true;
  });

  const hasFormChanged = useMemo(() => {
    if (!currentPortfolio) return false;

    const initial = initialPortfolioInput.current;

    if (portfolioInput.title !== currentPortfolio.title) return true;
    if (
      (portfolioInput.description ?? "") !==
      (currentPortfolio.description ?? "")
    )
      return true;
    if (
      (portfolioInput.is_highlight ?? false) !== currentPortfolio.is_highlight
    )
      return true;
    if ((portfolioInput.is_active ?? true) !== currentPortfolio.is_active)
      return true;
    if (portfolioInput.thumbnail) return true;

    if (!categoryIdsEqual(portfolioInput.categories, initial.categories))
      return true;

    if (!layoutInputsEqual(portfolioInput.layout, initial.layout)) return true;

    const baselineItems = initial.portfolioItems;
    const items = portfolioInput.portfolioItems;
    if (baselineItems.length !== items.length) return true;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const b = baselineItems[i];
      if (a.item !== b.item || a.id !== b.id) return true;
    }

    return false;
  }, [portfolioInput, currentPortfolio]);

  const canGoNextStep = useMemo(() => {
    const nextStep = currentStep + 1;
    if (nextStep > MAX_STEPS) return false;
    if (nextStep === 2) {
      return firstStepIsCompleted;
    }

    return false;
  }, [currentStep, firstStepIsCompleted]);

  const canSubmit = useMemo(() => {
    if (!firstStepIsCompleted || !portfolioInput.portfolioItems.length)
      return false;

    if (currentPortfolio) return hasFormChanged;

    return currentStep === MAX_STEPS;
  }, [
    currentStep,
    currentPortfolio,
    hasFormChanged,
    firstStepIsCompleted,
    portfolioInput.portfolioItems.length,
  ]);

  const handleStep = (direction: "prev" | "next") => {
    if (direction === "prev" && currentStep > 1) {
      setPortfolioInput((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    } else if (direction === "next" && canGoNextStep) {
      setPortfolioInput((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const clear = useCallback(() => {
    // Reset to an empty draft (single source of truth)
    initialPortfolioInput.current = buildPortfolioInput(user);
    setPortfolioInput(initialPortfolioInput.current);
    setCurrentPorfolio(undefined);
    // Reset action state (errors/result)
    reset();
  }, [user, reset]);

  const contextValue: PortfolioContextType = {
    user,
    handleSubmit,
    submitPortfolio,
    handleSetFormData,
    handleStep,
    currentStep,
    MAX_STEPS,
    portfolioInput,
    setPortfolioInput,
    inputErrors,
    isPending,
    success,
    portfolioResult,
    canGoNextStep,
    canSubmit,
    isHydrated,
    deleteInputErrorProperty,
    reset,
    clear,
    currentPortfolio,
    setPortfolio,
    portfolioItemCount,
    portfolioItemLimit: MAX_PORTFOLIO_ITEMS,
    isPortfolioItemsLimitReached,
    handleSetPortfolioItems,
    handleShiftPortfolioItem,
    handleRemovePortfolioItem,
    setCategorySelected,
    removeCategorySelected,
    setLayout,
    highlightCount,
    highlightLimit,
    isLoadingHighlightCount,
    fetchHighlightCount,
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
};
