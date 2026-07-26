"use client";

import { useTranslations } from "next-intl";
import { ConfirmSubmitButton } from "@/app/[locale]/(atelier)/__components/confirm-submit-button";
import { useCreateUpdateService } from "@/modules/services/providers/create-update-service.provider";

export const SubmitServiceButton = () => {
  const t = useTranslations("atelier.common");
  const { canSubmit, isPending, success, isUpdate, submitService } =
    useCreateUpdateService();
  const isActionable = canSubmit && !isPending;

  return (
    <ConfirmSubmitButton
      isActionable={isActionable}
      isPending={isPending}
      success={success}
      buttonLabel={
        isUpdate
          ? t("submit.updateServiceLabel")
          : t("submit.createServiceLabel")
      }
      dialogTitle={
        isUpdate
          ? t("submit.updateServiceTitle")
          : t("submit.createServiceTitle")
      }
      dialogDescription={
        isUpdate
          ? t("submit.updateServiceDescription")
          : t("submit.createServiceDescription")
      }
      onConfirm={() => void submitService()}
    />
  );
};
