"use client";
import type { CategoryBase } from "@repo/common-lib/types/category";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { UserCategoriesComponent } from "@/modules/categories/components/user-categories.component";
import {
  UpdateCategoriesProvider,
  useUpdateCategories,
} from "@/modules/categories/providers/categories.provider";
import {
  ButtonStepBackFunnel,
  ButtonSubmitFunnel,
  ContainerFormFunnel,
  useFunnelActions,
} from "./funnel.provider";

const MAX_DISCIPLINES = 5;
const MAX_STYLES = 5;

/**
 * Bridges a provider's internal selection out to the parent so both pickers
 * (rendered in separate providers) can be combined into one submitted value.
 */
function SelectionReporter({
  onChange,
}: {
  onChange: (categories: CategoryBase[]) => void;
}) {
  const { categoriesSelected } = useUpdateCategories();
  useEffect(() => {
    onChange(categoriesSelected);
  }, [categoriesSelected, onChange]);
  return null;
}

export function Step3Client({
  disciplineCategories,
  styleCategories,
}: {
  disciplineCategories: CategoryBase[];
  styleCategories: CategoryBase[];
}) {
  const t = useTranslations("userCategories");
  const { setCanContinue } = useFunnelActions();

  const [disciplineSelected, setDisciplineSelected] =
    useState<CategoryBase[]>(disciplineCategories);
  const [styleSelected, setStyleSelected] =
    useState<CategoryBase[]>(styleCategories);

  const combinedIds = useMemo(
    () =>
      [...disciplineSelected, ...styleSelected].map((c) => c.id).join(","),
    [disciplineSelected, styleSelected],
  );

  useEffect(() => {
    const hasSelection = combinedIds.length > 0;
    setCanContinue((prev) => (prev === hasSelection ? prev : hasSelection));
  }, [combinedIds, setCanContinue]);

  return (
    <>
      <p className="text-sm text-text-muted">{t("visibilityHint")}</p>

      <UpdateCategoriesProvider
        userCategories={disciplineCategories}
        initialRequest={{ type: "DISCIPLINE", exclude_parents: true }}
        maxSelections={MAX_DISCIPLINES}
      >
        <SelectionReporter onChange={setDisciplineSelected} />
        <UserCategoriesComponent title={t("disciplinesTitle")} />
      </UpdateCategoriesProvider>

      <UpdateCategoriesProvider
        userCategories={styleCategories}
        initialRequest={{ type: "ART_STYLE" }}
        maxSelections={MAX_STYLES}
      >
        <SelectionReporter onChange={setStyleSelected} />
        <UserCategoriesComponent title={t("artStylesTitle")} />
      </UpdateCategoriesProvider>

      <ContainerFormFunnel className="sticky bottom-0 bg-bg p-2">
        <input
          type="text"
          name="categories"
          hidden
          readOnly
          value={combinedIds}
        />
        <ButtonSubmitFunnel />
        <ButtonStepBackFunnel />
      </ContainerFormFunnel>
    </>
  );
}
