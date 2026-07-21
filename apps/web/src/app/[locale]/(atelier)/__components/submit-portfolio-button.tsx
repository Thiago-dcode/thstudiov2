"use client";

import { useTranslations } from "next-intl";
import { ConfirmSubmitButton } from "@/app/[locale]/(atelier)/__components/confirm-submit-button";
import { usePortfolio } from "@/modules/portfolios/providers/create-update-portfolio.provider";

export const SubmitPortfolioButton = () => {
  const t = useTranslations("atelier.common");
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
      buttonLabel={isUpdate ? t("update") : t("save")}
      dialogTitle={
        isUpdate
          ? t("submit.updatePortfolioTitle")
          : t("submit.savePortfolioTitle")
      }
      dialogDescription={
        isUpdate
          ? t("submit.updatePortfolioDescription")
          : t("submit.createPortfolioDescription")
      }
      onConfirm={() => void submitPortfolio()}
    />
  );
};
