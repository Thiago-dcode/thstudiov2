"use client";

import type { FullPortfolio } from "@repo/common-lib/types/portfolio";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { StickyFormFooter } from "@/app/[locale]/(atelier)/__components/sticky-form-footer";
import { SubmitPortfolioButton } from "@/app/[locale]/(atelier)/__components/submit-portfolio-button";
import FormComponent from "@/lib/components/form-component";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export const CreateOrUpdatePortfolio = ({
  defaultPortfolio,
}: {
  defaultPortfolio?: FullPortfolio;
}) => {
  const t = useTranslations("atelier.portfolios.form");
  const router = useRouter();
  const {
    handleSubmit,
    isPending,
    success,
    portfolioResult,
    currentStep,
    canGoNextStep,
    MAX_STEPS,
    inputErrors,
    clear,
    handleStep,
    setPortfolio,
    currentPortfolio,
    fetchHighlightCount,
    isHydrated,
  } = usePortfolio();

  const readOnly = Boolean((currentPortfolio ?? defaultPortfolio)?.blocked_at);

  useEffect(() => {
    void fetchHighlightCount();
  }, [fetchHighlightCount]);

  useEffect(() => {
    if (defaultPortfolio && currentPortfolio?.id !== defaultPortfolio.id) {
      setPortfolio(defaultPortfolio);
    }
    if (!defaultPortfolio && currentPortfolio) {
      clear();
    }
  }, [defaultPortfolio, setPortfolio, currentPortfolio, clear]);

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
    const slug = portfolioResult?.data?.slug;
    if (!success || !slug) return;
    router.push(`/atelier/portfolios/edit/${slug}`);
  }, [success, portfolioResult, router]);
  return (
    <FormComponent.Container>
      {readOnly ? (
        <div
          role="status"
          className="mb-6 border border-border/60 bg-fg-2/40 px-4 py-3 text-sm text-text-muted"
        >
          {t("blockedNotice")}
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

        <div
          className={
            readOnly ? "pointer-events-none select-none opacity-90" : undefined
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

        {/* Step progress + navigation */}
        <StickyFormFooter
          top={
            <div className="flex items-center gap-1.5">
              {Array.from({ length: MAX_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-all duration-300 ${
                    i < currentStep ? "bg-text" : "bg-fg-2"
                  }`}
                />
              ))}
            </div>
          }
        >
          <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4">
            <Button
              type="button"
              onClick={() => handleStep("prev")}
              variant="ghost"
              disabled={!isHydrated || currentStep <= 1 || isPending}
              className={`gap-2 ${currentStep <= 1 ? "invisible" : ""}`}
            >
              <ArrowLeft className="size-4" />
              <span className="hidden phone-lg:inline">{t("back")}</span>
            </Button>

            <span className="shrink-0 text-xs text-text-muted tabular-nums">
              {t("stepOf", { current: currentStep, total: MAX_STEPS })}
            </span>

            <div className="flex items-center gap-2">
              {!readOnly ? <SubmitPortfolioButton /> : null}
              {currentStep < MAX_STEPS ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStep("next");
                  }}
                  variant="default"
                  size="sm"
                  disabled={!isHydrated || !canGoNextStep || isPending}
                  className="gap-1.5 h-8 px-3 text-xs"
                >
                  <span className="hidden phone-lg:inline">{t("next")}</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        </StickyFormFooter>
      </FormComponent.Form>
    </FormComponent.Container>
  );
};
