"use client";

import { useTranslations } from "next-intl";
import { AlertButton } from "@/lib/components/alert-button";
import { useCollection } from "../providers/create-update-collection.provider";

export function AlertCollectionButton() {
  const t = useTranslations("atelier.common");
  const {
    collectionInput,
    currentCollection,
    isPending,
    mediaSelected,
    canSubmit,
  } = useCollection();

  const hasUnsavedWork =
    isPending ||
    !!currentCollection ||
    !!(
      collectionInput.title ||
      collectionInput.description ||
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
      label={
        currentCollection ? t("editingCollection") : t("creatingCollection")
      }
    />
  );
}
