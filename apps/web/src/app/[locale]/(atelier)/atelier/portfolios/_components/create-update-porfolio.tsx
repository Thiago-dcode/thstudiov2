"use client";

import type { FullPortfolio } from "@repo/common-lib/types/portfolio";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { SubmitPortfolioButton } from "@/app/[locale]/(atelier)/__components/submit-portfolio-button";
import FormComponent from "@/lib/components/form-component";
import { useCheckSlugAvalability } from "@/lib/hooks/useCheckSlugAvalability";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import { slugExistsAction } from "@/modules/portfolios/server-actions/slug-exists.action";
import { PortfolioSlugContext } from "./portfolio-slug.context";

export const CreateOrUpdatePortfolio = ({
  defaultPortfolio,
}: {
  defaultPortfolio?: FullPortfolio;
}) => {
  const router = useRouter();
  const {
    handleSubmit,
    isPending,
    success,
    currentStep,
    canGoNextStep,
    MAX_STEPS,
    inputErrors,
    clear,
    handleStep,
    setPortfolio,
    currentPortfolio,
    fetchHighlightCount,
    formData,
    user,
  } = usePortfolio();

  const checkSlugAvailabilityAction = useCallback(
    async (slug: string): Promise<ActionReturn<boolean | null, undefined>> => {
      const result = await slugExistsAction(user.username, slug);
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
    isLoading: isCheckingSlugAvailability,
    resetSlugCheck,
    resetSlugResult,
  } = useCheckSlugAvalability({
    actionFn: checkSlugAvailabilityAction,
  });

  useEffect(() => {
    resetSlugResult();
  }, [formData?.slug, resetSlugResult]);

  const slugContextValue = useMemo(
    () => ({
      checkSlugAvailability,
      isSlugAvailable,
      isCheckingSlugAvailability,
    }),
    [checkSlugAvailability, isSlugAvailable, isCheckingSlugAvailability],
  );

  const readOnly = Boolean((currentPortfolio ?? defaultPortfolio)?.blocked_at);

  useEffect(() => {
    void fetchHighlightCount();
  }, [fetchHighlightCount]);

  useEffect(() => {
    if (defaultPortfolio && currentPortfolio?.id !== defaultPortfolio.id) {
      setPortfolio(defaultPortfolio);
    }
    if (!defaultPortfolio && currentPortfolio) {
      resetSlugCheck();
      clear();
    }
  }, [defaultPortfolio, setPortfolio, currentPortfolio, clear, resetSlugCheck]);

  const StepComponent = useMemo(
    () =>
      dynamic(() => import(`./input-step-${currentStep}`), {
        loading: () => (
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="shrink-0 md:w-1/3 aspect-video" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ),
        ssr: false,
      }),
    [currentStep],
  );

  useEffect(() => {
    if (success) {
      resetSlugCheck();
      clear();
      router.push("/atelier/portfolios");
    }
  }, [success, clear, router.push, resetSlugCheck]);
  return (
    <PortfolioSlugContext.Provider value={slugContextValue}>
      <FormComponent.Container>
        {readOnly ? (
          <div
            role="status"
            className="mb-6 border border-border/60 bg-fg-2/40 px-4 py-3 text-sm text-text-muted"
          >
            This portfolio has been blocked. You can review it here, but it
            cannot be edited until the block is lifted.
          </div>
        ) : null}
        <FormComponent.Form
          onSubmit={async (e) => {
            if (readOnly) {
              e.preventDefault();
              return;
            }
            await handleSubmit(e);
          }}
          className="relative"
        >
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/70 backdrop-blur-[2px]">
              <Spinner className="size-10 text-text" />
            </div>
          )}
          <div className="flex justify-start mt-4">
            {!readOnly ? <SubmitPortfolioButton /> : null}
          </div>
          <div
            className={
              readOnly
                ? "pointer-events-none select-none opacity-90"
                : undefined
            }
          >
            <StepComponent />
          </div>

          {inputErrors && Object.keys(inputErrors).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(inputErrors).map(([field, message]) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1.5 bg-error/10 px-2.5 py-1 text-xs text-error"
                  title={message}
                >
                  <span className="size-1.5 bg-error" />
                  {field}
                </span>
              ))}
            </div>
          )}

          {/* Step Progress */}
          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: MAX_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-all duration-300 ${
                    i < currentStep ? "bg-text" : "bg-fg"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pb-4">
              <Button
                type="button"
                onClick={() => handleStep("prev")}
                variant="ghost"
                disabled={currentStep <= 1 || isPending}
                className={`gap-2 ${currentStep <= 1 ? "invisible" : ""}`}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>

              <span className="text-xs text-text-muted tabular-nums">
                {currentStep} / {MAX_STEPS}
              </span>

              {currentStep < MAX_STEPS ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStep("next");
                  }}
                  variant="default"
                  disabled={!canGoNextStep || isPending}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </FormComponent.Form>
      </FormComponent.Container>
    </PortfolioSlugContext.Provider>
  );
};
