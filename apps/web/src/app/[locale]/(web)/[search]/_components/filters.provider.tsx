"use client"

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
    segment: string
    filters: ArtistIndexRequest
    /** Parsed request from the current page URL; updates when the server passes new `params`. */
    urlParams: ArtistIndexRequest

    categoriesSelected: CategoryBase[]
    /** Replace the full category selection; updates `filters.categories`. */
    setCategoriesSelected: (categories: CategoryBase[]) => void
    /** Append a category if not already selected; updates `filters.categories`. */
    pushCategory: (category: CategoryBase) => void
    /** Remove a category by slug; clears `categories` when none remain. */
    removeCategory: (slug: string) => void
    /** Set a single filter key to the given value. */
    add: <K extends keyof ArtistIndexRequest>(
        key: K,
        value: ArtistIndexRequest[K],
    ) => void
    /** Set multiple filter keys in a single update. */
    addMany: (entries: Partial<ArtistIndexRequest>) => void
    /** Drop a single filter key. */
    delete: (key: keyof ArtistIndexRequest) => void
    /** Drop multiple filter keys in a single update. */
    deleteMany: (keys: (keyof ArtistIndexRequest)[]) => void
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
    segment: string
    params: ArtistIndexRequest
    defaultCategoriesSelected?: CategoryBase[]
}

/** Strip `page` so any filter change sends the user back to page 1. */
function withoutPage<T extends ArtistIndexRequest>(filters: T): T {
    const { page: _p, ...rest } = filters
    return rest as T
}

export function FiltersProvider({ children, segment, params: initialParams, defaultCategoriesSelected = [] }: FiltersProviderProps) {
    const [filters, setFilters] = useState<ArtistIndexRequest>(initialParams)

    const [categoriesSelected, setCategoriesSelectedState] =
        useState<CategoryBase[]>(defaultCategoriesSelected)
    /** Keep client filter state aligned with URL/searchParams when the server passes new `params`. */
    const paramsKey = JSON.stringify(initialParams)
    useEffect(() => {
        setFilters(initialParams)
    }, [paramsKey])


    const add = useCallback(
        <K extends keyof ArtistIndexRequest>(key: K, value: ArtistIndexRequest[K]) => {
            setFilters((prev) => {
                const next = { ...prev, [key]: value }
                // Geo-location and address filters are mutually exclusive.
                if (key === "lat" || key === "lng" || key === "radius_km") {
                    delete next.city
                    delete next.state
                    delete next.country
                } else if (key === "city" || key === "state" || key === "country") {
                    delete next.lat
                    delete next.lng
                    delete next.radius_km
                }
                // Reset pagination unless the caller is explicitly setting the page.
                return key === "page" ? next : withoutPage(next)
            })
        },
        [],
    )

    const addMany = useCallback((entries: Partial<ArtistIndexRequest>) => {
        setFilters((prev) => {
            const next = { ...prev, ...entries }
            const keys = Object.keys(entries) as (keyof ArtistIndexRequest)[]
            const hasGeo = keys.some((k) => k === "lat" || k === "lng" || k === "radius_km")
            const hasAddress = keys.some((k) => k === "city" || k === "state" || k === "country")
            if (hasGeo) { delete next.city; delete next.state; delete next.country }
            if (hasAddress) { delete next.lat; delete next.lng; delete next.radius_km }
            return withoutPage(next)
        })
    }, [])

    const deleteFilter = useCallback((key: keyof ArtistIndexRequest) => {
        setFilters((prev) => {
            const next = { ...prev }
            delete next[key]
            return key === "page" ? next : withoutPage(next)
        })
    }, [])

    const deleteMany = useCallback((keys: (keyof ArtistIndexRequest)[]) => {
        setFilters((prev) => {
            const next = { ...prev }
            for (const key of keys) delete next[key]
            return withoutPage(next)
        })
    }, [])

    const clearAll = useCallback(() => {
        setFilters({})
        setCategoriesSelectedState([])
    }, [])

    const setCategoriesSelected = useCallback((categories: CategoryBase[]) => {
        setCategoriesSelectedState(categories)
        setFilters((prev) => {
            const slugs = categories.map((c) => c.slug)
            const next = slugs.length === 0
                ? (({ categories: _c, ...rest }) => rest)(prev)
                : { ...prev, categories: slugs }
            return withoutPage(next)
        })
    }, [])

    const pushCategory = useCallback((category: CategoryBase) => {
        setCategoriesSelectedState((prev) => {
            if (prev.some((c) => c.id === category.id)) return prev
            return [...prev, category]
        })
        setFilters((prev) => {
            const slugs = prev.categories ?? []
            if (slugs.includes(category.slug)) return prev
            return withoutPage({ ...prev, categories: [...slugs, category.slug] })
        })
    }, [])

    const removeCategory = useCallback((slug: string) => {
        setCategoriesSelectedState((prev) => prev.filter((c) => c.slug !== slug))
        setFilters((prev) => {
            const slugs = prev.categories ?? []
            const next = slugs.filter((s) => s !== slug)
            const base = next.length === 0
                ? (({ categories: _c, ...rest }) => rest)(prev)
                : { ...prev, categories: next }
            return withoutPage(base)
        })
    }, []);



    const value = useMemo<FiltersContextValue>(
        () => ({
            segment,
            filters,
            urlParams: initialParams,
            categoriesSelected,
            setCategoriesSelected,
            pushCategory,
            removeCategory,
            add,
            addMany,
            delete: deleteFilter,
            deleteMany,
            clearAll,
        }),
        [
            segment,
            filters,
            initialParams,
            categoriesSelected,
            setCategoriesSelected,
            pushCategory,
            removeCategory,
            add,
            addMany,
            deleteFilter,
            deleteMany,
            clearAll,
        ],
    )

    return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}
