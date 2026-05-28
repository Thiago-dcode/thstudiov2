import { ArtistCard, ArtistIndexRequest } from "@repo/common-lib/types/user"
import { CategoryBase } from "@repo/common-lib/types/category"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import usersService from "@/modules/users/users.service"
import { UpdateCategoriesProvider } from "@/modules/categories/providers/categories.provider"
import { ArtistsGrid } from "./_components/artists-grid"
import { FiltersProvider } from "./_components/filters.provider"
import categoriesService from "@/modules/categories/categories.service"
import Web from "@/lib/components/web-page.component"
import { cn } from "@repo/ui/lib/utils"
import { ApiResponse, Pagination } from "@repo/common-lib/types/response"
import { cleanObj } from "@repo/common-lib/utils/cleanObj"
import { queryParamBuilder, QueryBuilder } from "@repo/common-lib/utils/query-builder"
import { AppPagination } from "@repo/ui/components/custom/app-pagination"
import { FilterSearch } from "./_components/filter-search"
import { SearchNearMeButton } from "./_components/search-near-me-button"
import { NearMeSessionCleaner } from "./_components/near-me-session-cleaner"

const VALID_SEARCH_SEGMENTS = ["artists", "portfolios"] as const

const PAGE_DESCRIPTION =
    "Browse artists on A11STUDIO. Discover portfolios, services, and creative professionals."

export const metadata: Metadata = {
    title: "Artists — A11STUDIO",
    description: PAGE_DESCRIPTION,
}

function firstString(value: string | string[] | undefined): string | undefined {
    if (value === undefined) return undefined
    const s = Array.isArray(value) ? value[0] : value
    return s === "" ? undefined : s
}

function optionalTrim(s: string | undefined): string | undefined {
    if (s === undefined) return undefined
    const t = s.trim()
    return t === "" ? undefined : t
}

function parseOptionalInt(s: string | undefined): number | undefined {
    if (s === undefined) return undefined
    const t = s.trim()
    if (t === "") return undefined
    const n = parseInt(t, 10)
    return Number.isFinite(n) ? n : undefined
}

function parseOptionalFloat(s: string | undefined): number | undefined {
    if (s === undefined) return undefined
    const t = s.trim()
    if (t === "") return undefined
    const n = parseFloat(t)
    return Number.isFinite(n) ? n : undefined
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

function artistFiltersToQuery(filters: ArtistIndexRequest): QueryBuilder {
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

function buildArtistIndexRequest(
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

export default async function ArtistsPage({
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
    const artistRequest = buildArtistIndexRequest(params)

    let artistsResult: ApiResponse<ArtistCard[]> | null = null
    const hasFilters = Object.keys(artistRequest).length > 0
    if (hasFilters) {
        artistsResult = await usersService.findAll({
            ...artistRequest,
            per_page: Math.min(artistRequest.per_page || 30, 50),
            page: artistRequest.page || 1,
            paginated: true,
        })
    }
    const artists: ArtistCard[] = !artistsResult ||
        artistsResult.error || !artistsResult.data ? [] : artistsResult.data
    const pagination: Pagination | undefined =
        artistsResult && !artistsResult.error ? artistsResult.pagination ?? undefined : undefined
    const totalCount = pagination?.total_count ?? artists.length

    const buildPaginationHref = (page: number) =>
        queryParamBuilder(
            "/artists",
            artistFiltersToQuery({ ...artistRequest, page }),
            { arrayStyle: "commas" },
        )
    let categories: CategoryBase[] = []
    if (artistRequest.categories?.length) {
        const categoriesResult = await categoriesService.getAll({
            slugs: artistRequest.categories,
        })
        categories = categoriesResult.data || []
    }
    const searchQuery = artistRequest.search?.trim()
    const resultsForSearchSuffix =
        searchQuery !== undefined && searchQuery !== ""
            ? ` for "${searchQuery}"`
            : ""
    const artistsErrorMessage =
        artistsResult?.error?.message ||
        "Something went wrong while searching artists. Please try again in a moment."
    return (
        <Web.Container
            className={cn(
                "flex h-full w-full flex-col justify-start"
            )}
        >
            <Web.Header
                title={`Searching for ${search}`}
                titleClassName="text-2xl tablet:text-3xl desktop:text-4xl"
            />
            <FiltersProvider params={artistRequest} defaultCategoriesSelected={categories}>
                <UpdateCategoriesProvider
                    userCategories={categories}
                >
                    <div
                    >
                        <NearMeSessionCleaner />
                        <FilterSearch />
                        {artistsResult?.error ? (
                            <section
                                aria-labelledby="artists-error-heading"
                                className="mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-2 border-t border-border pt-4 text-center tablet:max-w-3xl"
                                role="alert"
                            >
                                <h2
                                    id="artists-error-heading"
                                    className="text-sm font-medium tracking-wide text-error"
                                >
                                    We couldn&apos;t load artists
                                </h2>
                                <p className="text-sm text-text-muted">
                                    {artistsErrorMessage}
                                </p>
                            </section>
                        ) : artists.length ? (
                            <section
                                aria-labelledby="artists-results-heading"
                                className="flex w-full flex-col gap-4 pt-4"
                            >
                                <h5
                                    id="artists-results-heading"
                                    className="text-sm font-medium tracking-wide text-text-muted"
                                >
                                    {`${totalCount.toLocaleString()} artist${totalCount === 1 ? "" : "s"} found${resultsForSearchSuffix}`}
                                </h5>
                                <div className="flex flex-col gap-4">
                                    <ArtistsGrid artists={artists} />
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
                                            No artists found{resultsForSearchSuffix}
                                        </h2>
                                        <p className="text-sm text-text-muted" role="status">
                                            Your filters didn&apos;t match any artists. Try broadening
                                            your search or look for artists near you.
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
