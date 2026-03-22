"use client"

import { useHandleAction } from "@/modules/auth/hooks/useHandleAction"
import { getAllCategoriesAction } from "@/modules/categories/server-actions/categories.action"
import { CategoryBase } from "@repo/common-lib/types/category"
import { ArtistIndexRequest } from "@repo/common-lib/types/user"
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"

type FiltersContextValue = {
    filters: ArtistIndexRequest


    categoriesSelected:CategoryBase[]
    /** Append a category if not already selected; updates `filters.categories`. */
    pushCategory: (category: CategoryBase) => void
    /** Remove a category by id; clears `categories` when none remain. */
    removeCategory: (categoryId: number) => void
    /** Set a single filter key to the given value. */
    add: <K extends keyof ArtistIndexRequest>(
        key: K,
        value: ArtistIndexRequest[K],
    ) => void
    /** Drop a single filter key. */
    delete: (key: keyof ArtistIndexRequest) => void
    /** Reset all filters. */
    clearAll: () => void
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export const useFilters = () => {
    const ctx = useContext(FiltersContext)
    if (!ctx) {
        throw new Error("useFilters must be used within a FiltersProvider")
    }
    return ctx
}

type FiltersProviderProps = {
    children: ReactNode
    params: ArtistIndexRequest,
    defaultCategoriesSelected?: CategoryBase[]
}

function sortedCategoryIdsKey(categories: number[] | undefined): string {
    return (categories ?? [])
        .slice()
        .sort((a, b) => a - b)
        .join(",")
}

export function FiltersProvider({ children, params: initialParams, defaultCategoriesSelected = [] }: FiltersProviderProps) {
    const [filters, setFilters] = useState<ArtistIndexRequest>(initialParams)

    const [categoriesSelected, setCategoriesSelected] = useState<CategoryBase[]>(defaultCategoriesSelected)
    /** Keep client filter state aligned with URL/searchParams when the server passes new `params`. */
    const paramsKey = JSON.stringify(initialParams)
    useEffect(() => {
        setFilters(initialParams)
    }, [paramsKey])

    // const categoriesChanged = useMemo(() => {
    //     return (
    //         sortedCategoryIdsKey(filters.categories) !==
    //         sortedCategoryIdsKey(categoriesSelected.map(c => c.id))
    //     )
    // }, [filters.categories, categoriesSelected])

    const { handleAction } = useHandleAction({
        action: async () => getAllCategoriesAction({
            categories: filters.categories

        }),
        afterAction: async (result) => {

            if (result.data) {
                setCategoriesSelected(result.data)
            }
        }
    })

    // useEffect(() => {
    //     if (filters.categories?.length && categoriesChanged) {

    //         handleAction()
    //     }
    // }, [categoriesChanged, filters.categories])

    const add = useCallback(
        <K extends keyof ArtistIndexRequest>(key: K, value: ArtistIndexRequest[K]) => {
            setFilters((prev) => ({ ...prev, [key]: value }))
        },
        [],
    )

    const deleteFilter = useCallback((key: keyof ArtistIndexRequest) => {
        setFilters((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }, [])

    const clearAll = useCallback(() => {
        setFilters({})
    }, [])

    const pushCategory = useCallback((category: CategoryBase) => {
        setCategoriesSelected((prev) => {
            if (prev.some((c) => c.id === category.id)) return prev
            return [...prev, category]
        })
        setFilters((prev) => {
            const ids = prev.categories ?? []
            if (ids.includes(category.id)) return prev
            return { ...prev, categories: [...ids, category.id] }
        })
    }, [])

    const removeCategory = useCallback((categoryId: number) => {
        setCategoriesSelected((prev) => prev.filter((c) => c.id !== categoryId))
        setFilters((prev) => {
            const ids = prev.categories ?? []
            const next = ids.filter((id) => id !== categoryId)
            if (next.length === 0) {
                const { categories: _c, ...rest } = prev
                return rest
            }
            return { ...prev, categories: next }
        })
    }, [])

    const value = useMemo<FiltersContextValue>(
        () => ({
            filters,
            categoriesSelected,
            pushCategory,
            removeCategory,
            add,
            delete: deleteFilter,
            clearAll,
        }),
        [filters, categoriesSelected, pushCategory, removeCategory, add, deleteFilter, clearAll],
    )

    return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}
