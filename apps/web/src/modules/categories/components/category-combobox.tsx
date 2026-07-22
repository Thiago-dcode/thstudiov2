"use client";

import type { CategoryBase } from "@repo/common-lib/types/category";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/shadcn/combobox";
import { Spinner } from "@repo/ui/components/shadcn/spinner";
import { cn } from "@repo/ui/lib/utils";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useUpdateCategories } from "@/modules/categories/providers/categories.provider";

const DEFAULT_MAX_CATEGORY_SELECTION = 5;

function categoryLabel(c: CategoryBase) {
  return c.name;
}

const CategoryCombobox = ({
  categoriesSelected,
  setCategorySelected,
  removeCategorySelected,
  inputClassName,
  maxSelection = DEFAULT_MAX_CATEGORY_SELECTION,
}: {
  categoriesSelected: CategoryBase[];
  setCategorySelected: (categoryBase: CategoryBase) => void;
  removeCategorySelected: (categoryBase: CategoryBase) => void;
  inputClassName?: string;
  maxSelection?: number;
}) => {
  const t = useTranslations("search.combobox");
  const { categories, handleOnChange, isLoading } = useUpdateCategories();

  const sortedCategories = useMemo(() => {
    const selectedIds = new Set(categoriesSelected.map((c) => c.id));
    return [...categories].sort((a, b) => {
      const aSel = selectedIds.has(a.id);
      const bSel = selectedIds.has(b.id);
      if (aSel === bSel) return 0;
      return aSel ? -1 : 1;
    });
  }, [categories, categoriesSelected]);

  const handleSelectCategory = useCallback(
    (cat: CategoryBase) => {
      if (categoriesSelected.some((c) => c.id === cat.id)) {
        removeCategorySelected(cat);
      } else if (categoriesSelected.length < maxSelection) {
        setCategorySelected(cat);
      }
    },
    [
      categoriesSelected,
      setCategorySelected,
      removeCategorySelected,
      maxSelection,
    ],
  );

  const isSelected = useCallback(
    (cat: CategoryBase) => categoriesSelected.some((c) => c.id === cat.id),
    [categoriesSelected],
  );

  const busy = isLoading;

  return (
    <div className="flex w-full max-w-full flex-col gap-4">
      <div
        role="group"
        aria-label="Category filters"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1">
          <div className="min-w-0">
            <Combobox
              value={null}
              onValueChange={() => {}}
              items={sortedCategories}
              filteredItems={sortedCategories}
              itemToStringLabel={(item) => categoryLabel(item as CategoryBase)}
            >
              <ComboboxInput
                placeholder={
                  categoriesSelected.length
                    ? categoriesSelected.map((c) => c.name).join(", ")
                    : t("placeholder")
                }
                onChange={(e) => handleOnChange(e.target.value)}
                disabled={busy}
                showClear={!busy}
                className={inputClassName}
              />
              <ComboboxContent className="min-w-(--anchor-width) w-(--anchor-width) max-w-(--anchor-width)">
                <ComboboxEmpty>
                  {busy && sortedCategories.length === 0 ? (
                    <Spinner className="mx-auto size-3" />
                  ) : sortedCategories.length === 0 && !busy ? (
                    t("empty.searchingCategories")
                  ) : null}
                </ComboboxEmpty>
                <ComboboxList>
                  {sortedCategories.map((cat) => (
                    <ComboboxItem
                      key={cat.id}
                      value={String(cat.id)}
                      className={cn(
                        "cursor-pointer py-1.5 pl-1.5 pr-8 text-[11px] leading-tight",
                        isSelected(cat) && "bg-fg-2/60",
                      )}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleSelectCategory(cat);
                      }}
                    >
                      <span className="line-clamp-1 pr-1">
                        {categoryLabel(cat)}
                      </span>
                      {isSelected(cat) ? (
                        <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                          <CheckIcon className="size-3" />
                        </span>
                      ) : null}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCombobox;
