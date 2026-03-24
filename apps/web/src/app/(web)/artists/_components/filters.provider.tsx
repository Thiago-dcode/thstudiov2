"use client"

import { CategoryBase } from "@repo/common-lib/types/category"
import { ArtistIndexRequest } from "@repo/common-lib/types/user"
import { QueryBuilder, queryParamBuilder } from "@repo/common-lib/utils/query-builder"
import { usePathname, useSearchParams } from "next/navigation"
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"

type FiltersContextValue = {
    filters: ArtistIndexRequest

    isPrimaryFilterActive: boolean
    setIsPrimaryFilterActive: Dispatch<SetStateAction<boolean>>

    categoriesSelected: CategoryBase[]
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

function artistFiltersToQueryBuilder(filters: ArtistIndexRequest): QueryBuilder {
    const out: QueryBuilder = {}
    if (filters.page != null) out.page = filters.page
    if (filters.per_page != null) out.per_page = filters.per_page
    const search = filters.search?.trim()
    if (search) out.search = search
    if (filters.categories?.length) out.categories = filters.categories
    const country = filters.country?.trim()
    if (country) out.country = country
    const state = filters.state?.trim()
    if (state) out.state = state
    const city = filters.city?.trim()
    if (city) out.city = city
    if (filters.lat != null) out.lat = filters.lat
    if (filters.lng != null) out.lng = filters.lng
    if (filters.radius_km != null) out.radius_km = filters.radius_km
    return out
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

    const [isPrimaryFilterActive, setIsPrimaryFilterActive] = useState(false)

    const [categoriesSelected, setCategoriesSelected] = useState<CategoryBase[]>(defaultCategoriesSelected)
    /** Keep client filter state aligned with URL/searchParams when the server passes new `params`. */
    const paramsKey = JSON.stringify(initialParams)
    useEffect(() => {
        setFilters(initialParams)
    }, [paramsKey])


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
    }, []);



    const value = useMemo<FiltersContextValue>(
        () => ({
            filters,
            isPrimaryFilterActive,
            setIsPrimaryFilterActive,
            categoriesSelected,
            pushCategory,
            removeCategory,
            add,
            delete: deleteFilter,
            clearAll,
        }),
        [
            filters,
            isPrimaryFilterActive,
            categoriesSelected,
            pushCategory,
            removeCategory,
            add,
            deleteFilter,
            clearAll,
        ],
    )

    return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}
