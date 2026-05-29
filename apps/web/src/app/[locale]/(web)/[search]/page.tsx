import { ArtistCard, ArtistIndexRequest } from "@repo/common-lib/types/user"
import { Portfolio, PortfolioIndexRequest } from "@repo/common-lib/types/portfolio"
import { CategoryBase } from "@repo/common-lib/types/category"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import usersService from "@/modules/users/users.service"
import portfolioService from "@/modules/portfolios/portfolio.service"
import { UpdateCategoriesProvider } from "@/modules/categories/providers/categories.provider"
import { ArtistsGrid } from "./_components/artists-grid"
import { FiltersProvider } from "./_components/filters.provider"
import categoriesService from "@/modules/categories/categories.service"
import Web from "@/lib/components/web-page.component"
import { cn } from "@repo/ui/lib/utils"
import { ApiResponse, Pagination } from "@repo/common-lib/types/response"
import { cleanObj } from "@repo/common-lib/utils/cleanObj"
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder"
import { firstString, optionalTrim, parseOptionalInt, parseOptionalFloat } from "@repo/common-lib/utils/parse-params"
import { AppPagination } from "@repo/ui/components/custom/app-pagination"
import { FilterSearch } from "./_components/filter-search"
import { SearchNearMeButton } from "./_components/search-near-me-button"
import { NearMeSessionCleaner } from "./_components/near-me-session-cleaner"
import { SearchSegmentToggle } from "./_components/search-segment-toggle"
import { filtersToQuery } from "./_components/search.utils"

const VALID_SEARCH_SEGMENTS = ["artists", "portfolios"] as const

const PAGE_DESCRIPTION =
    "Browse artists on A11STUDIO. Discover portfolios, services, and creative professionals."

export const metadata: Metadata = {
    title: "Artists — A11STUDIO",
    description: PAGE_DESCRIPTION,
}

/** Comma-separated category slugs, aligned with `FilterSearch` / `queryParamBuilder` commas style. */
function extractCategorySlugs(categories: string | undefined): string[] | undefined {
    if (categories === undefined) return undefined
    const trimmed = categories.trim()
    if (!trimmed) return undefined
    const slugs = trimmed
        .split(",")
        .map((part) => part.trim())
        .filter((s) => s.length > 0)
    return slugs.length > 0 ? slugs : undefined
}


function buildSearchRequest(
    raw: Record<string, string | string[] | undefined>,
): ArtistIndexRequest {
    const q = (key: string) => firstString(raw[key])

    return cleanObj({
        page: parseOptionalInt(q("page")),
        per_page: parseOptionalInt(q("per_page")),
        search: optionalTrim(q("search")),
        categories: extractCategorySlugs(q("categories")),
        city: optionalTrim(q("city")),
        state: optionalTrim(q("state")),
        country: optionalTrim(q("country")),
        lat: parseOptionalFloat(q("lat")),
        lng: parseOptionalFloat(q("lng")),
        radius_km: parseOptionalFloat(q("radius_km")),
    })
}


type SearchResult =
    | { type: "artists"; items: ArtistCard[]; response: ApiResponse<ArtistCard[]> | null }
    | { type: "portfolios"; items: Portfolio[]; response: ApiResponse<Portfolio[]> | null }

async function fetchSearchResults(
    segment: string,
    request: ArtistIndexRequest,
    hasFilters: boolean,
): Promise<SearchResult> {
    const paginatedRequest = {
        ...request,
        per_page: Math.min(request.per_page || 30, 50),
        page: request.page || 1,
        paginated: true,
    }

    if (segment === "portfolios") {
        if (!hasFilters) return { type: "portfolios", items: [], response: null }
        const portfolioRequest: PortfolioIndexRequest = { ...paginatedRequest, is_active: true }
        const response = await portfolioService.findAll(portfolioRequest)
        const items = !response || response.error || !response.data ? [] : response.data
        return { type: "portfolios", items, response }
    }

    if (!hasFilters) return { type: "artists", items: [], response: null }
    const response = await usersService.findAll(paginatedRequest)
    const items = !response || response.error || !response.data ? [] : response.data
    return { type: "artists", items, response }
}

export default async function SearchPage({
    params: routeParams,
    searchParams,
}: {
    params: Promise<{ search: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const { search } = await routeParams
    if (!VALID_SEARCH_SEGMENTS.includes(search as (typeof VALID_SEARCH_SEGMENTS)[number])) {
        notFound()
    }

    const params = await searchParams
    const sharedRequest = buildSearchRequest(params)
    const hasFilters = Object.keys(sharedRequest).length > 0

    const result = await fetchSearchResults(search, sharedRequest, hasFilters)

    const pagination: Pagination | undefined =
        result.response && !result.response.error ? result.response.pagination ?? undefined : undefined
    const totalCount = pagination?.total_count ?? result.items.length

    const buildPaginationHref = (page: number) =>
        queryParamBuilder(
            `/${search}`,
            filtersToQuery({ ...sharedRequest, page }),
            { arrayStyle: "commas" },
        )
    let categories: CategoryBase[] = []
    if (sharedRequest.categories?.length) {
        const categoriesResult = await categoriesService.getAll({
            slugs: sharedRequest.categories,
        })
        categories = categoriesResult.data || []
    }
    const searchQuery = sharedRequest.search?.trim()
    const resultsForSearchSuffix =
        searchQuery !== undefined && searchQuery !== ""
            ? ` for "${searchQuery}"`
            : ""
    const errorMessage =
        result.response?.error?.message ||
        "Something went wrong while searching. Please try again in a moment."
    return (
        <Web.Container
            className={cn(
                "flex h-full w-full flex-col justify-start"
            )}
        >
            <div className="mb-4 flex flex-col items-start gap-3 tablet:mb-6 tablet:flex-row tablet:items-center tablet:justify-between">
                <Web.Header
                    title={`Searching for ${search}`}
                    titleClassName="text-2xl tablet:text-3xl desktop:text-4xl"
                />
                <SearchSegmentToggle active={search} filters={sharedRequest} />
            </div>
            <FiltersProvider segment={search} params={sharedRequest} defaultCategoriesSelected={categories}>
                <UpdateCategoriesProvider
                    userCategories={categories}
                >
                    <div
                    >
                        <NearMeSessionCleaner />
                        <FilterSearch />
                        {result.response?.error ? (
                            <section
                                aria-labelledby="search-error-heading"
                                className="mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-2 border-t border-border pt-4 text-center tablet:max-w-3xl"
                                role="alert"
                            >
                                <h2
                                    id="search-error-heading"
                                    className="text-sm font-medium tracking-wide text-error"
                                >
                                    We couldn&apos;t load {search}
                                </h2>
                                <p className="text-sm text-text-muted">
                                    {errorMessage}
                                </p>
                            </section>
                        ) : result.items.length ? (
                            <section
                                aria-labelledby="search-results-heading"
                                className="flex w-full flex-col gap-4 pt-4"
                            >
                                <h5
                                    id="search-results-heading"
                                    className="text-sm font-medium tracking-wide text-text-muted"
                                >
                                    {`${totalCount.toLocaleString()} ${search === "artists" ? `artist${totalCount === 1 ? "" : "s"}` : `portfolio${totalCount === 1 ? "" : "s"}`} found${resultsForSearchSuffix}`}
                                </h5>
                                <div className="flex flex-col gap-4">
                                    {result.type === "artists" && (
                                        <ArtistsGrid artists={result.items} />
                                    )}
                                    {result.type === "portfolios" && (
                                        null /* TODO: PortfoliosGrid */
                                    )}
                                    {pagination && (
                                        <AppPagination
                                            pagination={pagination}
                                            buildHref={buildPaginationHref}
                                        />
                                    )}
                                </div>
                            </section>
                        ) : (
                            <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-4 pt-8 text-center tablet:max-w-3xl">
                                {hasFilters && (
                                    <div className="flex flex-col items-center gap-2">
                                        <h2 className="text-sm font-medium tracking-wide text-text">
                                            No {search} found{resultsForSearchSuffix}
                                        </h2>
                                        <p className="text-sm text-text-muted" role="status">
                                            Your filters didn&apos;t match any {search}. Try broadening
                                            your search or look for {search} near you.
                                        </p>
                                    </div>
                                )}
                                <SearchNearMeButton />
                            </section>
                        )}
                    </div>
                </UpdateCategoriesProvider>
            </FiltersProvider>
        </Web.Container>
    )
}
