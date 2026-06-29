"use client";

import { AlertButton } from "@/lib/components/alert-button";
import { usePortfolio } from "../providers/create-update-portfolio.provider";

export function AlertPortfolioButton() {
  const { formData, currentPortfolio, isPending, portfolioItems, canSubmit } =
    usePortfolio();

  const hasUnsavedWork =
    isPending ||
    !!currentPortfolio ||
    !!(
      formData.title ||
      formData.slug ||
      formData.description ||
      portfolioItems.length
    );

  return (
    <AlertButton
      condition={!hasUnsavedWork || !canSubmit}
      skipPath="atelier/portfolios"
      navigateTo={
        currentPortfolio
          ? `/atelier/portfolios/edit/${currentPortfolio.slug}`
          : "/atelier/portfolios/create"
      }
      label={currentPortfolio ? "Editing portfolio" : "Creating portfolio"}
    />
  );
}
