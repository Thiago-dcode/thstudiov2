'use client'

import CategoryCombobox from '@/modules/categories/components/category-combobox'
import { useCallback } from 'react'
import { artistsFilterComboboxInputClassName } from './artists-filter-combobox-input-class'
import { useFilters } from './filters.provider'

const CategoryFilter = () => {
    const { categoriesSelected, pushCategory, removeCategory } = useFilters()

    const handleRemove = useCallback(
        (cat: { slug: string }) => removeCategory(cat.slug),
        [removeCategory],
    )

    return (
        <CategoryCombobox
            categoriesSelected={categoriesSelected}
            setCategorySelected={pushCategory}
            removeCategorySelected={handleRemove}
            inputClassName={artistsFilterComboboxInputClassName}
        />
    )
}

export default CategoryFilter
