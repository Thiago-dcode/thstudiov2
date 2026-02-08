"use client";

import { createContext, useContext, ReactNode, useState, useMemo, useCallback, useRef } from "react";
import { CreatePortfolioInputWithFile, FullPortfolio } from "@repo/common-lib/types/portfolio";
import { Media } from "@repo/common-lib/types/media";
import { useHandleAction } from "@/modules/auth/hooks/useHandleAction";
import { createPortfolioAction } from "../server-actions/create-portfolio.action";
import { slugExistsAction } from "../server-actions/slug-exists.action";
import { ActionReturn } from "@/modules/auth/auth.types";

// ============================================================================
// Types
// ============================================================================

type PortfolioFormData = Partial<
  Omit<CreatePortfolioInputWithFile, 'media'> & {
    media?: Media[];
  }
>;

type PortfolioContextType = {
  userId: number;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  // `media` is overridden in this provider to be `Media[]` for UI purposes.
  handleSetFormData: (key: keyof CreatePortfolioInputWithFile, value: string | File | number | Media[]) => void;
  handleStep: (direction: 'prev' | 'next') => void;
  currentStep: number;
  MAX_STEPS: number;
  formData: PortfolioFormData;
  mediaSelected: Media[];
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

  const [formData, setFormData] = useState<PortfolioFormData>({
    user_id: userId,
  });
  const [currentStep, setCurrentStep] = useState(2);

  const idTimeOut = useRef<NodeJS.Timeout>(null);


  const { handleSubmit, isPending, success, deleteInputErrorProperty, inputErrors, reset } = useHandleAction({
    action: async (formData) => {
      formData.set('user_id', userId + '');
      return await createPortfolioAction(formData);
    },
    afterAction: async (result) => {
      if (result.data) {
        //todo
      }
    },
    beforeAction: async () => {
      reset();
    }
  });

  const slugChecksMemo = useRef<Record<string, ActionReturn<undefined, boolean>>>({})
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
    if (!formData || !formData.slug || isPendingSlugExists) return;
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
    handleSetFormData('media', [...current, m]);
  }, [formData.media, handleSetFormData]);

  const handleRemoveMediaSelected = useCallback((mediaId: number) => {
    const current = formData.media ?? [];
    handleSetFormData('media', current.filter((media) => media.id !== mediaId));
  }, [formData.media, handleSetFormData]);

  const mediaSelected = useMemo(() => {
    return formData.media ?? [];
  }, [formData.media]);

  const canGoNextStep = useMemo(() => {
    const nextStep = currentStep + 1;
    if (nextStep > MAX_STEPS) return false;
    if (nextStep === 2) {
      return !firstStepRequiredFields.some(field => !formData || !formData[field])
    }

    return false;
  }, [currentStep, formData]);

  const canSubmit = useMemo(() => {
    return (currentStep === MAX_STEPS && !firstStepRequiredFields.some(field => !formData || !formData[field]) && (formData?.media?.length || formData?.collections?.length)) ? true : false
  }, [currentStep, formData])


  const handleStep = (direction: 'prev' | 'next') => {

    if (direction === 'prev' && currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (direction === 'next' && canGoNextStep) {

      setCurrentStep(prev => prev + 1);
    }
  }

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
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
};

