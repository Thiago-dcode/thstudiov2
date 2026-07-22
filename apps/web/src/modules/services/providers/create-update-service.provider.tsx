"use client";

import { MAX_HIGHLIGHT_SERVICES } from "@repo/common-lib/constants/highlights";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type { FullService, Service } from "@repo/common-lib/types/service";
import { isAValidSlugFormat } from "@repo/common-lib/utils/generate-valid-slug";
import { isHighlightToggleDisabled } from "@repo/common-lib/utils/highlights";
import { toast } from "@repo/ui/sonner";
import { useTranslations } from "next-intl";
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

/**
 * Single source of truth for the ref-backed (uncontrolled) service form fields.
 * Kept in one ref so inputs stay uncontrolled and don't re-render on each keystroke.
 * Reactive lists (features/terms/portfolio/highlight) remain in React state.
 */
export type ServiceInput = {
  title: string;
  slug: string;
  description: string;
  price: string;
  is_active: boolean;
  show_price: boolean;
  is_highlight: boolean;
  thumbnail: File | undefined;
  /** slug tracking metadata */
  manuallyChangedSlug: boolean;
  previousSlug: string | undefined;
  originallyHighlighted: boolean;
};

const createEmptyServiceInput = (): ServiceInput => ({
  title: "",
  slug: "",
  description: "",
  price: "",
  is_active: true,
  show_price: false,
  is_highlight: false,
  thumbnail: undefined,
  manuallyChangedSlug: false,
  previousSlug: undefined,
  originallyHighlighted: false,
});

type CreateUpdateServiceContextType = {
  user: UserAuth;
  currentService: FullService | undefined;
  setService: (service: FullService) => void;
  clear: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  /** Submits the service without requiring a form submit event (e.g. from a confirmation dialog). */
  submitService: () => Promise<void>;
  isPending: boolean;
  success: boolean;
  inputErrors: Record<string, string> | undefined;
  deleteInputErrorProperty: (key: string) => void;
  canSubmit: boolean;
  hasUnsavedWork: boolean;
  readOnly: boolean;
  isUpdate: boolean;
  /** Single source of truth for the ref-backed form fields. */
  serviceInput: MutableRefObject<ServiceInput>;
  slugInputRef: MutableRefObject<HTMLInputElement | null>;
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
  const t = useTranslations("atelier.services");
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

  const serviceInput = useRef<ServiceInput>(createEmptyServiceInput());
  const slugInputRef = useRef<HTMLInputElement>(null);

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
      const input = serviceInput.current;
      const payload: ServiceActionInput = {
        title: input.title,
        slug: input.slug,
        description: input.description ?? "",
        price: input.price ? Number(input.price) : undefined,
        is_active: input.is_active,
        show_price: input.show_price,
        is_highlight: input.is_highlight,
        portfolio_id: selectedPortfolioId,
        user_id: user.id,
        thumbnail: input.thumbnail,
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
        toast.success(isUpdate ? t("toastUpdated") : t("toastCreated"));
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
      serviceInput.current.slug = newSlug;
      if (slugInputRef.current) slugInputRef.current.value = newSlug;

      const currentSlug = newSlug.trim();
      const previousSlug = serviceInput.current.previousSlug?.trim();
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

      serviceInput.current.previousSlug = newSlug;
    },
    [checkSlugAvailability, currentService?.slug],
  );

  const handleThumbnailChange = useCallback(
    (file: File | undefined) => {
      if (serviceInput.current.thumbnail === file) return;
      serviceInput.current.thumbnail = file;
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

    const input = serviceInput.current;

    if (input.title !== currentService.title) return true;
    if (input.slug !== currentService.slug) return true;
    if ((input.description ?? "") !== (currentService.description ?? "")) {
      return true;
    }

    const currentPrice = input.price.trim();
    const originalPrice =
      currentService.price != null ? String(currentService.price) : "";
    if (currentPrice !== originalPrice) return true;

    if (input.is_active !== currentService.is_active) return true;
    if (input.show_price !== currentService.show_price) return true;
    if (input.is_highlight !== currentService.is_highlight) return true;

    if (
      (selectedPortfolioId ?? null) !== (currentService.portfolio_id ?? null)
    ) {
      return true;
    }

    if (input.thumbnail) return true;

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
    const hasTitle = !!serviceInput.current.title.trim();
    const hasSlug = !!serviceInput.current.slug.trim();
    if (!hasTitle || !hasSlug) return false;
    if (isUpdate) return hasFormChanged;
    return true;
  }, [formRevision, hasFormChanged, isUpdate]);

  const hasUnsavedWork = useMemo(() => {
    const input = serviceInput.current;
    const hasTitle = !!input.title.trim();
    const hasSlug = !!input.slug.trim();
    const hasDraftContent =
      hasTitle ||
      hasSlug ||
      !!input.description.trim() ||
      !!input.price.trim() ||
      features.some((feature) => feature.trim()) ||
      terms.some((term) => term.trim()) ||
      !!input.thumbnail ||
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
    serviceInput.current.originallyHighlighted,
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (readOnly || !canSubmit) return;
      await handleAction();
    },
    [canSubmit, handleAction, readOnly],
  );

  const submitService = useCallback(async () => {
    if (readOnly || !canSubmit) return;
    await handleAction();
  }, [canSubmit, handleAction, readOnly]);

  const populateFromService = useCallback(
    (service: FullService) => {
      serviceInput.current = {
        title: service.title,
        slug: service.slug,
        description: service.description ?? "",
        price: service.price != null ? String(service.price) : "",
        is_active: service.is_active,
        show_price: service.show_price,
        is_highlight: service.is_highlight,
        thumbnail: undefined,
        manuallyChangedSlug: false,
        previousSlug: service.slug,
        originallyHighlighted: service.is_highlight,
      };
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
    serviceInput.current = createEmptyServiceInput();
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
      submitService,
      isPending,
      success,
      inputErrors,
      deleteInputErrorProperty,
      canSubmit,
      hasUnsavedWork,
      readOnly,
      isUpdate,
      serviceInput,
      slugInputRef,
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
      submitService,
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
