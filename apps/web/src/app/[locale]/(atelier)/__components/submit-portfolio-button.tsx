"use client";

import { ConfirmSubmitButton } from "@/app/[locale]/(atelier)/__components/confirm-submit-button";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export const SubmitPortfolioButton = () => {
  const {
    canSubmit,
    isPending,
    success,
    currentPortfolio,
    isHydrated,
    submitPortfolio,
  } = usePortfolio();
  const isUpdate = Boolean(currentPortfolio);
  const isActionable = isHydrated && canSubmit && !isPending;

  return (
    <ConfirmSubmitButton
      isActionable={isActionable}
      isPending={isPending}
      success={success}
      buttonLabel={isUpdate ? "Update" : "Save"}
      dialogTitle={isUpdate ? "Update portfolio" : "Save portfolio"}
      dialogDescription={
        isUpdate
          ? "Your changes will be saved and applied to your live portfolio."
          : "Your portfolio will be created and saved to your account."
      }
      onConfirm={() => void submitPortfolio()}
    />
  );
};
