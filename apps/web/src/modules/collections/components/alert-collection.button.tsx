"use client";

import { AlertButton } from "@/lib/components/alert-button";
import { useCollection } from "../providers/create-update-collection.provider";

export function AlertCollectionButton() {
  const { formData, currentCollection, isPending, mediaSelected, canSubmit } =
    useCollection();

  const hasUnsavedWork =
    isPending ||
    !!currentCollection ||
    !!(
      formData.title ||
      formData.slug ||
      formData.description ||
      mediaSelected.length
    );

  return (
    <AlertButton
      condition={!hasUnsavedWork || !canSubmit}
      skipPath="atelier/collections"
      navigateTo={
        currentCollection
          ? `/atelier/collections/edit/${currentCollection.slug}`
          : "/atelier/collections/create"
      }
      label={currentCollection ? "Editing collection" : "Creating collection"}
    />
  );
}
