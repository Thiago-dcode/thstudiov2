"use client";

import { AlertButton } from "@/lib/components/alert-button";
import { usePortfolio } from "../providers/create-update-portfolio.provider";

export function AlertPortfolioButton() {
  const { portfolioInput, currentPortfolio, isPending, canSubmit } =
    usePortfolio();

  const hasUnsavedWork =
    isPending ||
    !!currentPortfolio ||
    !!(
      portfolioInput.title ||
      portfolioInput.slug ||
      portfolioInput.description ||
      portfolioInput.portfolioItems.length
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
