"use client";

import { MAX_HIGHLIGHT_SERVICES } from "@repo/common-lib/constants/highlights";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type { FullService, Service } from "@repo/common-lib/types/service";
import { isAValidSlugFormat } from "@repo/common-lib/utils/generate-valid-slug";
import { isHighlightToggleDisabled } from "@repo/common-lib/utils/highlights";
import { toast } from "@repo/ui/sonner";
import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCheckSlugAvalability } from "@/lib/hooks/useCheckSlugAvalability";
import type { UserAuth } from "@/modules/auth/auth.types";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdateServiceAction } from "../server-actions/create-update-service.action";
import { getServiceHighlightCountAction } from "../server-actions/get-highlight-count.action";
import { serviceSlugExistsAction } from "../server-actions/slug-exists.action";

type ServiceActionInput = Parameters<typeof createOrUpdateServiceAction>[0];

type CreateUpdateServiceContextType = {
  user: UserAuth;
  currentService: FullService | undefined;
  setService: (service: FullService) => void;
  clear: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isPending: boolean;
  success: boolean;
  inputErrors: Record<string, string> | undefined;
  deleteInputErrorProperty: (key: string) => void;
  canSubmit: boolean;
  hasUnsavedWork: boolean;
  readOnly: boolean;
  isUpdate: boolean;
  titleRef: MutableRefObject<string>;
  slugRef: MutableRefObject<string>;
  slugInputRef: MutableRefObject<HTMLInputElement | null>;
  descriptionRef: MutableRefObject<string>;
  priceRef: MutableRefObject<string>;
  isActiveRef: MutableRefObject<boolean>;
  showPriceRef: MutableRefObject<boolean>;
  isHighlightRef: MutableRefObject<boolean>;
  manuallyChangedSlug: MutableRefObject<boolean>;
  notifyFormChange: () => void;
  updateSlug: (newSlug: string) => void;
  handleThumbnailChange: (file: File | undefined) => void;
  features: string[];
  setFeatures: (value: string[]) => void;
  terms: string[];
  setTerms: (value: string[]) => void;
  selectedPortfolioId: number | undefined;
  setSelectedPortfolioId: (value: number | undefined) => void;
  isHighlighted: boolean;
  setIsHighlighted: (value: boolean) => void;
  isValidSlug: boolean | undefined;
  isSlugAvailable?: boolean;
  isCheckingSlug: boolean;
  highlightCount: number;
  highlightLimit: number;
  highlightToggleDisabled: boolean;
  isLoadingHighlightCount: boolean;
  fetchHighlightCount: (options?: { force?: boolean }) => Promise<void>;
};

const CreateUpdateServiceContext =
  createContext<CreateUpdateServiceContextType | null>(null);

export const useCreateUpdateService = () => {
  const context = useContext(CreateUpdateServiceContext);
  if (!context) {
    throw new Error(
      "useCreateUpdateService must be used within a CreateUpdateServiceProvider",
    );
  }
  return context;
};

type CreateUpdateServiceProviderProps = {
  children: ReactNode;
  user: UserAuth;
};

export function CreateUpdateServiceProvider({
  children,
  user,
}: CreateUpdateServiceProviderProps) {
  const [currentService, setCurrentService] = useState<FullService | undefined>(
    undefined,
  );
  const highlightLimit = MAX_HIGHLIGHT_SERVICES;
  const isUpdate = !!currentService;
  const readOnly = Boolean(currentService?.blocked_at);

  const highlightCountMemo = useRef<ActionReturn<
    number | null,
    undefined
  > | null>(null);
  const forceHighlightFetchRef = useRef(false);

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
      return await getServiceHighlightCountAction();
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

  const titleRef = useRef("");
  const slugRef = useRef("");
  const slugInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef("");
  const priceRef = useRef("");
  const isActiveRef = useRef(true);
  const showPriceRef = useRef(false);
  const isHighlightRef = useRef(false);
  const originallyHighlightedRef = useRef(false);
  const manuallyChangedSlug = useRef(false);
  const previousSlugRef = useRef<string | undefined>(undefined);
  const thumbnailFileRef = useRef<File | undefined>(undefined);

  const [isHighlighted, setIsHighlighted] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<
    number | undefined
  >(undefined);
  const [features, setFeatures] = useState<string[]>([""]);
  const [terms, setTerms] = useState<string[]>([""]);
  const [isValidSlug, setIsValidSlug] = useState<boolean | undefined>(
    undefined,
  );
  const [formRevision, setFormRevision] = useState(0);

  const notifyFormChange = useCallback(() => {
    setFormRevision((revision) => revision + 1);
  }, []);

  const {
    handleAction,
    isPending,
    success,
    inputErrors,
    deleteInputErrorProperty,
    reset,
  } = useHandleAction<ServiceActionInput, Service>({
    action: async () => {
      const payload: ServiceActionInput = {
        title: titleRef.current,
        slug: slugRef.current,
        description: descriptionRef.current ?? "",
        price: priceRef.current ? Number(priceRef.current) : undefined,
        is_active: isActiveRef.current,
        show_price: showPriceRef.current,
        is_highlight: isHighlightRef.current,
        portfolio_id: selectedPortfolioId,
        user_id: user.id,
        thumbnail: thumbnailFileRef.current,
        features: features
          .filter((f) => f.trim())
          .map((f) => ({ title: f.trim() })),
        terms: terms.filter((t) => t.trim()).map((t) => ({ title: t.trim() })),
      };

      return await createOrUpdateServiceAction(payload, currentService);
    },
    afterAction: async (result) => {
      if (result.errors) {
        for (const error of result.errors) {
          toast.error(error);
        }
      } else if (result.data) {
        await fetchHighlightCount({ force: true });
        toast.success(isUpdate ? "Service updated" : "Service created");
      }
    },
    beforeAction: async () => {
      reset();
    },
  });

  const checkSlugAvailabilityAction = useCallback(
    async (slug: string): Promise<ActionReturn<boolean | null, undefined>> => {
      const result = await serviceSlugExistsAction(user.username, slug);
      return {
        data: !result.data,
        errors: null,
        inputErrors: undefined,
      };
    },
    [user.username],
  );

  const {
    checkSlugAvailability,
    isAvailable: isSlugAvailable,
    isLoading: isCheckingSlug,
  } = useCheckSlugAvalability({
    actionFn: checkSlugAvailabilityAction,
  });

  const updateSlug = useCallback(
    (newSlug: string) => {
      slugRef.current = newSlug;
      if (slugInputRef.current) slugInputRef.current.value = newSlug;

      const currentSlug = newSlug.trim();
      const previousSlug = previousSlugRef.current?.trim();
      const slugChanged = currentSlug !== previousSlug;

      if (currentSlug) {
        const valid = isAValidSlugFormat(currentSlug);
        setIsValidSlug(valid);
        if (
          slugChanged &&
          valid &&
          !currentSlug.endsWith("-") &&
          currentSlug !== currentService?.slug?.trim()
        ) {
          checkSlugAvailability(currentSlug);
        }
      } else {
        setIsValidSlug(undefined);
      }

      previousSlugRef.current = newSlug;
    },
    [checkSlugAvailability, currentService?.slug],
  );

  const handleThumbnailChange = useCallback(
    (file: File | undefined) => {
      if (thumbnailFileRef.current === file) return;
      thumbnailFileRef.current = file;
      notifyFormChange();
    },
    [notifyFormChange],
  );

  const normalizeStringList = useCallback(
    (items: string[]) => items.map((item) => item.trim()).filter(Boolean),
    [],
  );

  const hasFormChanged = useMemo(() => {
    if (!currentService) return false;

    if (titleRef.current !== currentService.title) return true;
    if (slugRef.current !== currentService.slug) return true;
    if ((descriptionRef.current ?? "") !== (currentService.description ?? "")) {
      return true;
    }

    const currentPrice = priceRef.current.trim();
    const originalPrice =
      currentService.price != null ? String(currentService.price) : "";
    if (currentPrice !== originalPrice) return true;

    if (isActiveRef.current !== currentService.is_active) return true;
    if (showPriceRef.current !== currentService.show_price) return true;
    if (isHighlightRef.current !== currentService.is_highlight) return true;

    if (
      (selectedPortfolioId ?? null) !== (currentService.portfolio_id ?? null)
    ) {
      return true;
    }

    if (thumbnailFileRef.current) return true;

    const originalFeatures =
      currentService.features?.map((feature) => feature.title) ?? [];
    const originalTerms = currentService.terms?.map((term) => term.title) ?? [];

    if (
      normalizeStringList(features).join("\n") !==
      normalizeStringList(originalFeatures).join("\n")
    ) {
      return true;
    }

    if (
      normalizeStringList(terms).join("\n") !==
      normalizeStringList(originalTerms).join("\n")
    ) {
      return true;
    }

    return false;
  }, [
    currentService,
    features,
    formRevision,
    isHighlighted,
    normalizeStringList,
    selectedPortfolioId,
    terms,
  ]);

  const canSubmit = useMemo(() => {
    const hasTitle = !!titleRef.current.trim();
    const hasSlug = !!slugRef.current.trim();
    if (!hasTitle || !hasSlug) return false;
    if (isUpdate) return hasFormChanged;
    return true;
  }, [formRevision, hasFormChanged, isUpdate]);

  const hasUnsavedWork = useMemo(() => {
    const hasTitle = !!titleRef.current.trim();
    const hasSlug = !!slugRef.current.trim();
    const hasDraftContent =
      hasTitle ||
      hasSlug ||
      !!descriptionRef.current.trim() ||
      !!priceRef.current.trim() ||
      features.some((feature) => feature.trim()) ||
      terms.some((term) => term.trim()) ||
      !!thumbnailFileRef.current ||
      selectedPortfolioId !== undefined;

    return isPending || (isUpdate ? hasFormChanged : hasDraftContent);
  }, [
    features,
    formRevision,
    hasFormChanged,
    isPending,
    isUpdate,
    selectedPortfolioId,
    terms,
  ]);

  const highlightToggleDisabled = isHighlightToggleDisabled(
    highlightCount,
    highlightLimit,
    isHighlighted,
    originallyHighlightedRef.current,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (readOnly || !canSubmit) return;
      await handleAction();
    },
    [canSubmit, handleAction, readOnly],
  );

  const populateFromService = useCallback(
    (service: FullService) => {
      titleRef.current = service.title;
      slugRef.current = service.slug;
      descriptionRef.current = service.description ?? "";
      priceRef.current = service.price != null ? String(service.price) : "";
      isActiveRef.current = service.is_active;
      showPriceRef.current = service.show_price;
      isHighlightRef.current = service.is_highlight;
      originallyHighlightedRef.current = service.is_highlight;
      manuallyChangedSlug.current = false;
      previousSlugRef.current = service.slug;
      thumbnailFileRef.current = undefined;
      setIsHighlighted(service.is_highlight);
      setSelectedPortfolioId(service.portfolio_id ?? undefined);
      setFeatures(
        service.features?.length ? service.features.map((f) => f.title) : [""],
      );
      setTerms(
        service.terms?.length ? service.terms.map((t) => t.title) : [""],
      );
      setIsValidSlug(undefined);
      notifyFormChange();
    },
    [notifyFormChange],
  );

  const setService = useCallback(
    (service: FullService) => {
      setCurrentService(service);
      populateFromService(service);
    },
    [populateFromService],
  );

  const clear = useCallback(() => {
    setCurrentService(undefined);
    titleRef.current = "";
    slugRef.current = "";
    descriptionRef.current = "";
    priceRef.current = "";
    isActiveRef.current = true;
    showPriceRef.current = false;
    isHighlightRef.current = false;
    originallyHighlightedRef.current = false;
    manuallyChangedSlug.current = false;
    previousSlugRef.current = undefined;
    thumbnailFileRef.current = undefined;
    setIsHighlighted(false);
    setSelectedPortfolioId(undefined);
    setFeatures([""]);
    setTerms([""]);
    setIsValidSlug(undefined);
    reset();
    notifyFormChange();
  }, [notifyFormChange, reset]);

  useEffect(() => {
    void fetchHighlightCount();
  }, [fetchHighlightCount]);

  const contextValue = useMemo(
    (): CreateUpdateServiceContextType => ({
      user,
      currentService,
      setService,
      clear,
      handleSubmit,
      isPending,
      success,
      inputErrors,
      deleteInputErrorProperty,
      canSubmit,
      hasUnsavedWork,
      readOnly,
      isUpdate,
      titleRef,
      slugRef,
      slugInputRef,
      descriptionRef,
      priceRef,
      isActiveRef,
      showPriceRef,
      isHighlightRef,
      manuallyChangedSlug,
      notifyFormChange,
      updateSlug,
      handleThumbnailChange,
      features,
      setFeatures,
      terms,
      setTerms,
      selectedPortfolioId,
      setSelectedPortfolioId,
      isHighlighted,
      setIsHighlighted,
      isValidSlug,
      isSlugAvailable,
      isCheckingSlug,
      highlightCount,
      highlightLimit,
      highlightToggleDisabled,
      isLoadingHighlightCount,
      fetchHighlightCount,
    }),
    [
      user,
      currentService,
      setService,
      clear,
      handleSubmit,
      isPending,
      success,
      inputErrors,
      deleteInputErrorProperty,
      canSubmit,
      hasUnsavedWork,
      readOnly,
      isUpdate,
      notifyFormChange,
      updateSlug,
      handleThumbnailChange,
      features,
      terms,
      selectedPortfolioId,
      isHighlighted,
      isValidSlug,
      isSlugAvailable,
      isCheckingSlug,
      highlightCount,
      highlightToggleDisabled,
      isLoadingHighlightCount,
      fetchHighlightCount,
    ],
  );

  return (
    <CreateUpdateServiceContext.Provider value={contextValue}>
      {children}
    </CreateUpdateServiceContext.Provider>
  );
}
