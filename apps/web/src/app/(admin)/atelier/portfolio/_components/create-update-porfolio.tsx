'use client'

import FormComponent from "@/lib/components/form-component";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useEffect, useMemo } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { FullPortfolio } from "@repo/common-lib/types/portfolio";
import { SubmitPortfolioButton } from "@/app/(admin)/__components/submit-portfolio-button";


export const CreateOrUpdatePortfolio = ({ defaultPortfolio }: {
    defaultPortfolio?: FullPortfolio
}) => {
    const router = useRouter();
    const { handleSubmit, isPending, success, currentStep, canGoNextStep, MAX_STEPS, inputErrors, clear, handleStep, setPortfolio, currentPortfolio } = usePortfolio();

    useEffect(() => {
        if (defaultPortfolio && currentPortfolio?.id !== defaultPortfolio.id) {
            setPortfolio(defaultPortfolio);
        }
        if (!defaultPortfolio && currentPortfolio) {
            clear();
        }
    }, [defaultPortfolio, setPortfolio, currentPortfolio]);

    const StepComponent = useMemo(() => dynamic(() => import('./input-step-' + currentStep), {
        loading: () => (
            <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="shrink-0 md:w-1/3 aspect-video rounded-lg" />
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
            </div>
        ),
        ssr: false
    }), [currentStep]);


    useEffect(() => {

        if (success) {
            clear();
            router.push('/atelier/portfolio')
        }

    }, [success]);
    return (
        <FormComponent.Container>
            <FormComponent.Form onSubmit={handleSubmit} className="relative">
                {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-bg/70 backdrop-blur-[2px]">
                        <Spinner className="size-10 text-accent" />
                    </div>
                )}
                <div className="flex justify-start mt-4">
                    <SubmitPortfolioButton />
                </div>
                <StepComponent />

                {inputErrors && Object.keys(inputErrors).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(inputErrors).map(([field, message]) => (
                            <span
                                key={field}
                                className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-2.5 py-1 text-xs text-error"
                                title={message}
                            >
                                <span className="size-1.5 rounded-full bg-error" />
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
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentStep ? 'bg-accent' : 'bg-fg-1'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pb-4">
                        <Button
                            type="button"
                            onClick={() => handleStep('prev')}
                            variant="ghost"
                            disabled={currentStep <= 1 || isPending}
                            className={`gap-2 ${currentStep <= 1 ? 'invisible' : ''}`}
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
                                    handleStep('next');
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
    );
};

