"use client";

import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useRef } from "react";
import { CreatePortfolioInputWithFile, FullPortfolio } from "@repo/common-lib/types/portfolio";
import { Media, MediaPortfolio } from "@repo/common-lib/types/media";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createOrUpdatePortfolioAction } from "../server-actions/create-update-portfolio.action";
import { slugExistsAction } from "../server-actions/slug-exists.action";
import { ActionReturn } from "@repo/common-lib/types/response";
import { toast } from "@repo/ui/sonner"

// ============================================================================
// Types
// ============================================================================

type PortfolioFormData = Partial<
  Omit<CreatePortfolioInputWithFile, 'media'> & {
    media?: MediaPortfolio[];
  }
>;

type PortfolioContextType = {
  userId: number;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  // `media` is overridden in this provider to be `Media[]` for UI purposes.
  handleSetFormData: (key: keyof CreatePortfolioInputWithFile, value: string | File | number | MediaPortfolio[]) => void;
  handleStep: (direction: 'prev' | 'next') => void;
  currentStep: number;
  MAX_STEPS: number;
  formData: PortfolioFormData;
  mediaSelected: MediaPortfolio[];
  handlePushMediaSelected: (media: Media) => void;
  handleRemoveMediaSelected: (mediaId: number) => void;
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
  userId: number;
  defaultPortfolio?: FullPortfolio;
};

const MAX_STEPS = 2;
const firstStepRequiredFields: (keyof CreatePortfolioInputWithFile)[] = ['user_id', 'slug', 'title', 'thumbnail'];
export const PortfolioProvider = ({
  children,
  userId,
  defaultPortfolio,
}: PortfolioProviderProps) => {

  const [currentPortfolio, setCurrentPorfolio] = useState(defaultPortfolio);

  const [formData, setFormData] = useState<PortfolioFormData>({
    user_id: userId,
  });

  const setPortfolio = useCallback((portfolio: FullPortfolio) => {
    setCurrentPorfolio(portfolio);
    setCurrentStep(1);
    setFormData({
      user_id: portfolio.user_id,
      title: portfolio.title,
      slug: portfolio.slug,
      description: portfolio.description ?? undefined,
      media: portfolio.media.sort((a,b)=>a.position - b.position),
    });
  }, []);

  const [currentStep, setCurrentStep] = useState(1);

  const idTimeOut = useRef<NodeJS.Timeout>(null);


  const { handleAction, isPending, success, deleteInputErrorProperty, inputErrors, reset } = useHandleAction({
    action: async () => {
      const media = (formData.media ?? []).map((m, idx) => ({
        id: m.id,
        position: idx + 1,
      }));

      const payload: Partial<CreatePortfolioInputWithFile> = {
        title: (formData.title ?? "") as string,
        slug: (formData.slug ?? "") as string,
        description: (formData.description ?? undefined) as string | undefined,
        user_id: (formData.user_id ?? userId) as number,
        thumbnail: formData.thumbnail ? formData.thumbnail as File : undefined,
        media: media.length ? media : undefined,
      };

      return await createOrUpdatePortfolioAction(payload, currentPortfolio);
    },
    afterAction: async (result) => {

      if (result.errors) {
        result.errors.forEach((error) => toast.error(error))
      } else if (result.data) {
        clear()
        toast.success(currentPortfolio ? "Portfolio updated successfully" : "Portfolio created successfully")
      }
    }, 
    beforeAction: async () => {
      reset();
    }
  });

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleAction();
  }, [handleAction]);

  const slugChecksMemo = useRef<Record<string, ActionReturn<boolean, undefined>>>({})
  const { handleAction: handleActionSlug, result: resultSlugExist, isPending: isPendingSlugExists, cleanResult, cleanErrors } = useHandleAction({
    action: async () => {
      // Normalize slug before checking to match how it's stored in DB (without trailing hyphens)

      const slugToCheck = formData.slug || '';

      if (slugChecksMemo.current[slugToCheck]) {
        return slugChecksMemo.current[slugToCheck];
      }
      return await slugExistsAction(userId, slugToCheck);
    },
    afterAction: async (data) => {

      slugChecksMemo.current[formData.slug || ''] = data

    }
  });

  const checkSlugAvailability = useCallback(async () => {
    if (!formData || !formData.slug || isPendingSlugExists || formData.slug === currentPortfolio?.slug) return;
    if (idTimeOut.current) clearTimeout(idTimeOut.current);
    idTimeOut.current = setTimeout(() => {
      cleanResult();
      cleanErrors();
      handleActionSlug();
      if (idTimeOut.current) clearTimeout(idTimeOut.current);
    }, 1000);
  }, [formData, isPendingSlugExists, cleanResult, cleanErrors, handleActionSlug]);

  const handleSetFormData = useCallback((key: keyof CreatePortfolioInputWithFile, value: any) => {

    if (key === 'slug') {
      cleanResult();
      cleanErrors();
    }
    setFormData(prev => {
      if (prev) {
        return {
          ...prev,
          [key]: value
        }
      }
      return {
        [key]: value
      }
    })

  }, [cleanErrors, cleanResult])

  const handlePushMediaSelected = useCallback((m: Media) => {
    const current = formData.media ?? [];
    if (current.some((x) => x.id === m.id)) return;
    const media: MediaPortfolio = { ...m, position: current.length + 1 };
    handleSetFormData('media', [...current, media]);
  }, [formData.media, handleSetFormData]);

  const handleRemoveMediaSelected = useCallback((mediaId: number) => {
    const current = formData.media ?? [];
    handleSetFormData('media', current.filter((media) => media.id !== mediaId));
  }, [formData.media, handleSetFormData]);

  const firstStepIsCompleted = !firstStepRequiredFields.some(field => {
    if (!formData) return true;
    const hasField = formData[field];
    if (hasField) return false;

    if (field === 'thumbnail' && currentPortfolio?.thumbnail) return false;
    return true;
  })
  const mediaSelected = useMemo(() => {
    return formData.media ? formData.media.sort((a, b) => a.position - b.position):[];
  }, [formData.media]);

  const canGoNextStep = useMemo(() => {
    const nextStep = currentStep + 1;
    if (nextStep > MAX_STEPS) return false;
    if (nextStep === 2) {
      return firstStepIsCompleted
    }

    return false;
  }, [currentStep, formData, currentPortfolio]);

  const canSubmit = useMemo(() => {
    return ((currentStep === MAX_STEPS || currentPortfolio) && firstStepIsCompleted && (formData.media?.length || formData.collections?.length)) ? true : false
  }, [currentStep, formData])


  const handleStep = (direction: 'prev' | 'next') => {

    if (direction === 'prev' && currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (direction === 'next' && canGoNextStep) {

      setCurrentStep(prev => prev + 1);
    }
  }

  const clear = useCallback(() => {
    // Reset local state
    setFormData({ user_id: userId });
    setCurrentStep(1);
    setCurrentPorfolio(undefined);
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
  }, [userId, reset, cleanErrors, cleanResult]);

  const contextValue: PortfolioContextType = {
    userId,
    handleSubmit,
    handleSetFormData,
    handleStep,
    currentStep,
    MAX_STEPS,
    formData,
    mediaSelected,
    handlePushMediaSelected,
    handleRemoveMediaSelected,
    inputErrors,
    isPending,
    success,
    canGoNextStep,
    canSubmit,
    isSlugAvailable: typeof resultSlugExist?.data === 'boolean' ? !resultSlugExist.data : undefined,
    isCheckingSlugAvailability: isPendingSlugExists,
    checkSlugAvailability,
    deleteInputErrorProperty,
    reset,
    clear,
    currentPortfolio,
    setPortfolio,
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
};

