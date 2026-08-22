"use client";
import { MAX_CATEGORIES_USER } from "@repo/common-lib/constants/limits";
import { Label } from "@repo/ui/components/shadcn/label";
import { cn } from "@repo/ui/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import CategoryCombobox from "@/modules/categories/components/category-combobox";
import { useGetCategories } from "@/modules/categories/providers/getCategories.provider";
import {
  ButtonStepBackFunnel,
  ButtonSubmitFunnel,
  ContainerFormFunnel,
  useFunnelActions,
} from "./funnel.provider";

export function Step3Client() {
  const t = useTranslations("userCategories");
  const { setCanContinue } = useFunnelActions();
  const { categoriesSelected } = useGetCategories();

  const selectedIds = Array.from(categoriesSelected.values())
    .map((c) => c.id)
    .join(",");

  useEffect(() => {
    const hasSelection = selectedIds.length > 0;
    setCanContinue((prev) => (prev === hasSelection ? prev : hasSelection));
  }, [selectedIds, setCanContinue]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{t("title")}</Label>
          <span
            className={cn(
              "text-xs text-text-muted tabular-nums",
              categoriesSelected.size >= MAX_CATEGORIES_USER && "text-text",
            )}
          >
            {categoriesSelected.size}/{MAX_CATEGORIES_USER}
          </span>
        </div>
        <CategoryCombobox />
      </div>

      <ContainerFormFunnel className="sticky bottom-0 bg-bg p-2">
        <input
          type="text"
          name="categories"
          hidden
          readOnly
          value={selectedIds}
        />
        <ButtonSubmitFunnel />
        <ButtonStepBackFunnel />
      </ContainerFormFunnel>
    </div>
  );
}
