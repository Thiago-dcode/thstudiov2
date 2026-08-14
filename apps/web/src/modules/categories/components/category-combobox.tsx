"use client";

import { ENUMS, type EnumType } from "@repo/common-lib/constants/enums";
import type { CategoryBase } from "@repo/common-lib/types/category";
import { Button } from "@repo/ui/components/shadcn/button";
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
import { CheckIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGetCategories } from "@/modules/categories/providers/getCategories.provider";

/** Types offered as popup filters — tags are an internal search aid, not a pickable facet. */
const FILTERABLE_TYPES = ENUMS.CATEGORY_TYPE.filter((type) => type !== "TAGS");

function categoryLabel(c: CategoryBase) {
  return c.name;
}

const CategoryCombobox = ({
  inputClassName,
  selectCategory,
  removeCategory,
}: {
  inputClassName?: string;
  selectCategory?: (category: CategoryBase) => void;
  removeCategory?: (category: CategoryBase) => void;
}) => {
  const t = useTranslations("search.combobox");
  const {
    categoriesToDisplay,
    categoriesSelected,
    currentFilters,
    handleRemoveCategory,
    handleOnChange,
    handleSelectCategory,
    isSelected,
    isLoading,
  } = useGetCategories();

  const typeLabels: Record<EnumType<"CATEGORY_TYPE">, string> = {
    DISCIPLINE: t("types.DISCIPLINE"),
    ART_STYLE: t("types.ART_STYLE"),
    TAGS: t("types.TAGS"),
  };

  const selectedList = Array.from(categoriesSelected.values());

  return (
    <div
      role="group"
      aria-label={t("groupLabel")}
      className="flex w-full min-w-0 flex-col gap-2"
    >
      <Combobox
        value={null}
        onValueChange={() => {}}
        items={categoriesToDisplay}
        filteredItems={categoriesToDisplay}
        itemToStringLabel={(item) => categoryLabel(item as CategoryBase)}
      >
        <ComboboxInput
          placeholder={t("placeholder")}
          onChange={(e) =>
            handleOnChange({
              searchQuery: e.target.value,
            })
          }
          disabled={isLoading}
          showClear={!isLoading}
          className={cn("w-full", inputClassName)}
        />

        {selectedList.length > 0 && (
          <ul
            aria-label={t("selectedLabel")}
            className="flex min-w-0 flex-wrap items-center gap-1.5"
          >
            {selectedList.map((category) => (
              <li key={`category-selected-${category.id}`}>
                <Button
                  type="button"
                  variant="badge"
                  aria-label={t("remove", { label: category.name })}
                  onClick={() => {
                    handleRemoveCategory(category);
                    if (removeCategory) removeCategory(category);
                  }}
                >
                  <span className="min-w-0 flex-1 text-left line-clamp-2">
                    {category.name}
                  </span>
                  <span
                    className="pointer-events-none flex size-5 shrink-0 items-center justify-center text-text-muted transition-colors group-hover:text-text/90"
                    aria-hidden
                  >
                    <X className="size-3" />
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}

        <ComboboxContent className="min-w-(--anchor-width) w-(--anchor-width) max-w-(--anchor-width)">
          <div
            role="group"
            aria-label={t("typeFilterLabel")}
            className="flex flex-wrap items-center gap-1.5 border-b border-fg-2 p-1.5"
          >
            {FILTERABLE_TYPES.map((type) => {
              const active = type === currentFilters.type;
              return (
                <Button
                  key={`category-filter-type-${type}`}
                  type="button"
                  size="sm"
                  aria-pressed={active}
                  variant={active ? "primary" : "outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    handleOnChange({
                      ...currentFilters,
                      type: active ? undefined : type,
                    });
                  }}
                  className="h-7 flex-nowrap gap-1 px-2.5 py-1 text-[11px] font-medium shadow-none"
                >
                  {typeLabels[type]}
                  {active && <X className="size-3 opacity-70" aria-hidden />}
                </Button>
              );
            })}
          </div>

          <ComboboxEmpty className="px-3 py-4 text-xs">
            {isLoading && categoriesToDisplay.length === 0 ? (
              <Spinner className="mx-auto size-4" />
            ) : categoriesToDisplay.length === 0 && !isLoading ? (
              t("empty.searchingCategories")
            ) : null}
          </ComboboxEmpty>

          <ComboboxList>
            {categoriesToDisplay.map((cat) => {
              const selected = isSelected(cat);

              return (
                <ComboboxItem
                  key={cat.id}
                  value={String(cat.id)}
                  className={cn(
                    "cursor-pointer p-0 pr-0",
                    selected && "bg-fg-2/60",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();

                      if (!selected) {
                        handleSelectCategory(cat);
                        if (selectCategory) selectCategory(cat);
                      } else {
                        handleRemoveCategory(cat);
                        if (removeCategory) removeCategory(cat);
                      }
                    }}
                    className="w-full flex-nowrap justify-between gap-2 px-2 py-1.5 text-left text-xs leading-tight text-text hover:text-text"
                  >
                    <span className="min-w-0 flex-1 truncate text-left">
                      {categoryLabel(cat)}
                    </span>
                    {!currentFilters.type && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-text-muted">
                        {typeLabels[cat.type]}
                      </span>
                    )}
                    {selected && (
                      <CheckIcon className="size-3.5 shrink-0" aria-hidden />
                    )}
                  </Button>
                </ComboboxItem>
              );
            })}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

export default CategoryCombobox;
