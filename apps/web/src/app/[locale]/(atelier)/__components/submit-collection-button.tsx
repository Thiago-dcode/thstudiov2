"use client";

import { ConfirmSubmitButton } from "@/app/[locale]/(atelier)/__components/confirm-submit-button";
import { useCollection } from "@/modules/collections/providers/create-update-collection.provider";

export const SubmitCollectionButton = () => {
  const { canSubmit, isPending, success, currentCollection, submitCollection } =
    useCollection();
  const isUpdate = Boolean(currentCollection);
  const isActionable = canSubmit && !isPending;

  return (
    <ConfirmSubmitButton
      isActionable={isActionable}
      isPending={isPending}
      success={success}
      buttonLabel={isUpdate ? "Update" : "Save"}
      dialogTitle={isUpdate ? "Update collection" : "Save collection"}
      dialogDescription={
        isUpdate
          ? "Your changes will be saved and applied to your live collection."
          : "Your collection will be created and saved to your account."
      }
      onConfirm={() => void submitCollection()}
    />
  );
};
