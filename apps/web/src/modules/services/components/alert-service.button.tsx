"use client";

import { AlertButton } from "@/lib/components/alert-button";
import { useCreateUpdateService } from "../providers/create-update-service.provider";

export function AlertServiceButton() {
  const { currentService, hasUnsavedWork, canSubmit } =
    useCreateUpdateService();

  return (
    <AlertButton
      condition={!hasUnsavedWork || !canSubmit}
      skipPath="atelier/services"
      navigateTo={
        currentService
          ? `/atelier/services/edit/${currentService.slug}`
          : "/atelier/services/create"
      }
      label={currentService ? "Editing service" : "Creating service"}
    />
  );
}
