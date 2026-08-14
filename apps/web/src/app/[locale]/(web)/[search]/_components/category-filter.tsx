"use client";

import { useCallback } from "react";
import CategoryCombobox from "@/modules/categories/components/category-combobox";
import { artistsFilterComboboxInputClassName } from "./artists-filter-combobox-input-class";
import { useFilters } from "./filters.provider";

const CategoryFilter = () => {
  const { pushCategory, removeCategory } = useFilters();

  const handleRemove = useCallback(
    (cat: { slug: string }) => removeCategory(cat.slug),
    [removeCategory],
  );

  return (
    <CategoryCombobox
      selectCategory={pushCategory}
      removeCategory={handleRemove}
      inputClassName={artistsFilterComboboxInputClassName}
    />
  );
};

export default CategoryFilter;
