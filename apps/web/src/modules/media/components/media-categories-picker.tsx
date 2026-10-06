"use client";

import { MAX_CATEGORIES_MEDIA } from "@repo/common-lib/constants/limits";
import type { CategoryBase } from "@repo/common-lib/types/category";
import CategoryCombobox from "@/modules/categories/components/category-combobox";
import { GetCategoriesProvider } from "@/modules/categories/providers/getCategories.provider";

/**
 * The portfolio form's category picker, bound to a list that lives somewhere else — the staged
 * uploads, or an edit draft — instead of owning its own selection.
 *
 * `selected` is the single source of truth: the picker follows it, and every pick or removal comes
 * back through `onChange` with the full next list.
 */
export function MediaCategoriesPicker({
  selected,
  onChange,
  positionerClassName,
}: {
  selected: CategoryBase[];
  onChange: (next: CategoryBase[]) => void;
  /** Above the host dialog's z-index, or the options open behind it. */
  positionerClassName?: string;
}) {
  return (
    <GetCategoriesProvider
      initialCategories={selected}
      syncSelected={selected}
      maxSelections={MAX_CATEGORIES_MEDIA}
      // "Portrait Photography" already says "Photography": only the specific ones are offered.
      leavesOnly
    >
      <CategoryCombobox
        positionerClassName={positionerClassName}
        selectCategory={(category) => {
          // The combobox disables rows past the cap; this keeps the list honest if one slips by.
          if (
            selected.length >= MAX_CATEGORIES_MEDIA ||
            selected.some((c) => c.id === category.id)
          )
            return;
          onChange([...selected, category]);
        }}
        removeCategory={(category) =>
          onChange(selected.filter((c) => c.id !== category.id))
        }
      />
    </GetCategoriesProvider>
  );
}
