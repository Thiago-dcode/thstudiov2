"use client";

import { useTranslations } from "next-intl";
import { ConfirmSubmitButton } from "@/app/[locale]/(atelier)/__components/confirm-submit-button";
import { useCollection } from "@/modules/collections/providers/create-update-collection.provider";

export const SubmitCollectionButton = () => {
  const t = useTranslations("atelier.common");
  const { canSubmit, isPending, success, currentCollection, submitCollection } =
    useCollection();
  const isUpdate = Boolean(currentCollection);
  const isActionable = canSubmit && !isPending;

  return (
    <ConfirmSubmitButton
      isActionable={isActionable}
      isPending={isPending}
      success={success}
      buttonLabel={isUpdate ? t("update") : t("save")}
      dialogTitle={
        isUpdate
          ? t("submit.updateCollectionTitle")
          : t("submit.saveCollectionTitle")
      }
      dialogDescription={
        isUpdate
          ? t("submit.updateCollectionDescription")
          : t("submit.createCollectionDescription")
      }
      onConfirm={() => void submitCollection()}
    />
  );
};
