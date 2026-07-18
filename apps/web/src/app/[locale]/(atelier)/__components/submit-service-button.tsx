"use client";

import { ConfirmSubmitButton } from "@/app/[locale]/(atelier)/__components/confirm-submit-button";
import { useCreateUpdateService } from "@/modules/services/providers/create-update-service.provider";

export const SubmitServiceButton = () => {
  const { canSubmit, isPending, success, isUpdate, submitService } =
    useCreateUpdateService();
  const isActionable = canSubmit && !isPending;

  return (
    <ConfirmSubmitButton
      isActionable={isActionable}
      isPending={isPending}
      success={success}
      buttonLabel={isUpdate ? "Update Service" : "Create Service"}
      dialogTitle={isUpdate ? "Update service" : "Create service"}
      dialogDescription={
        isUpdate
          ? "Your changes will be saved and applied to your live service."
          : "Your service will be created and saved to your account."
      }
      onConfirm={() => void submitService()}
    />
  );
};
