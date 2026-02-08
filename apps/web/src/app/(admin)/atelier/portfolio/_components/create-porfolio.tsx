'use client'

import FormComponent from "@/lib/components/form-component";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";
import dynamic from "next/dynamic";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { useMemo } from "react";
import { Button } from "@repo/ui/components/shadcn/button";
import { ArrowLeft, ArrowRight } from "lucide-react";


export const CreatePortfolio = () => {
    const { handleSubmit, isPending, success, currentStep, canGoNextStep, canSubmit, MAX_STEPS, formData, handleStep } = usePortfolio();

    const StepComponent = useMemo(() => dynamic(() => import('./input-step-' + currentStep), {
        loading: () => <Spinner className="size-12" />,
        ssr: false
    }), [currentStep]);
    return (
        <FormComponent.Container>
            <FormComponent.Form onSubmit={handleSubmit}>
                <StepComponent />
                <div className="mt-8 space-y-4">
                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4 w-full">
                    {currentStep > 1 ? (
                                <Button
                                    onClick={() => handleStep('prev')}
                                    variant="ghost"
                                    disabled={isPending}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="size-4" />
                                    Previous
                                </Button>
                            ) : (
                                <div /> // Spacer to maintain layout
                            )}

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                            <span>Step {currentStep}</span>
                            <span className="text-text-muted/50">of</span>
                            <span>{MAX_STEPS}</span>
                        </div>

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
                        ) : <FormComponent.SubmitButton
                            disabled={!canSubmit || isPending}
                            isPending={isPending}
                            success={success}
                            className="w-auto m-0"
                        >
                            Create Portfolio
                        </FormComponent.SubmitButton>}
                    </div>


                </div>
            </FormComponent.Form>
        </FormComponent.Container>
    );
};

