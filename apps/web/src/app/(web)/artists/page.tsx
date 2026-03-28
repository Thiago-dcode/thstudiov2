import { ArtistCard, ArtistIndexRequest } from "@repo/common-lib/types/user"
import { CategoryBase } from "@repo/common-lib/types/category"
import { Metadata } from "next"
import usersService from "@/modules/users/users.service"
import { UpdateCategoriesProvider } from "@/modules/categories/providers/categories.provider"
import { ArtistsBrowseLayout } from "./_components/artists-browse-layout"
import { ArtistsGrid } from "./_components/artists-grid"
import { FiltersProvider } from "./_components/filters.provider"
import categoriesService from "@/modules/categories/categories.service"
import Web from "@/lib/components/web-page.component"
import { cn } from "@repo/ui/lib/utils"
import { ApiResponse } from "@repo/common-lib/types/response"
import { cleanObj } from "@repo/common-lib/utils/cleanObj"

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

function extractCategories(categories: string | undefined): number[] | undefined {
    if (categories === undefined) return undefined
    const trimmed = categories.trim()
    if (!trimmed) return undefined
    const ids = trimmed
        .split(",")
        .map((part) => parseInt(part.trim(), 10))
        .filter((n) => !Number.isNaN(n))
    return ids.length > 0 ? ids : undefined
}

function buildArtistIndexRequest(
    raw: Record<string, string | string[] | undefined>,
): ArtistIndexRequest {
    const q = (key: string) => firstString(raw[key])

    return cleanObj( {
        page: parseOptionalInt(q("page")),
        per_page: parseOptionalInt(q("per_page")),
        search: optionalTrim(q("search")),
        categories: extractCategories(q("categories")),
        city: optionalTrim(q("city")),
        state: optionalTrim(q("state")),
        country: optionalTrim(q("country")),
        lat: parseOptionalFloat(q("lat")),
        lng: parseOptionalFloat(q("lng")),
        radius_km: parseOptionalFloat(q("radius_km")),
    })
}

export default async function ArtistsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const artistRequest = buildArtistIndexRequest(params)
   
    let artistsResult: ApiResponse<ArtistCard[]> | null = null
    const hasFilters = Object.keys(artistRequest).length > 0
    if (hasFilters) {
        artistsResult = await usersService.findAll(artistRequest)
    }
    const artists: ArtistCard[] = !artistsResult ||
        artistsResult.error || !artistsResult.data ? [] : artistsResult.data
    const totalCount =
        artistsResult && !artistsResult.error && artistsResult.pagination != null
            ? artistsResult.pagination.total_count
            : artists.length
    let categories: CategoryBase[] = []
    if (artistRequest.categories?.length) {
        const categoriesResult = await categoriesService.getAll({
            categories: artistRequest.categories
        })
        categories = categoriesResult.data || []
    }
    const searchQuery = artistRequest.search?.trim()
    const resultsForSearchSuffix =
        searchQuery !== undefined && searchQuery !== ""
            ? ` for "${searchQuery}"`
            : ""
    return (
        <Web.Container
            className={cn(
                "flex h-full w-full flex-col justify-center pt-16",
            )}
        >
            <Web.Header
                title="Search for artists"
                titleClassName="text-2xl tablet:text-3xl desktop:text-4xl"
            />
            <FiltersProvider params={artistRequest} defaultCategoriesSelected={categories}>
                <UpdateCategoriesProvider
                    userCategories={categories}
                >
                    <div
                        className={cn(
                            "flex w-full flex-col items-start justify-start",
                        )}
                    >
                        <ArtistsBrowseLayout
                            initialFilters={artistRequest}
                            centerSearch={!artistsResult}
                        >
                            {artistsResult ? (
                                <section
                                    aria-labelledby="artists-results-heading"
                                    className="flex w-full min-w-0 flex-col gap-4 border-t border-border pt-4"
                                >
                                    <h2
                                        id="artists-results-heading"
                                        className="text-sm font-medium tracking-wide text-text-muted"
                                    >
                                        {artistsResult.error
                                            ? "Results"
                                            : totalCount === 0
                                              ? `No artists found${resultsForSearchSuffix}`
                                              : `${totalCount.toLocaleString()} artist${totalCount === 1 ? "" : "s"} found${resultsForSearchSuffix}`}
                                    </h2>
                                    {artistsResult.error ? (
                                        <p className="text-sm text-destructive" role="alert">
                                            {artistsResult.error.message ||
                                                "Could not load artists."}
                                        </p>
                                    ) : artists.length === 0 ? (
                                        <p className="text-sm text-text-muted">
                                            Try broadening your search or clearing some filters.
                                        </p>
                                    ) : (
                                        <ArtistsGrid artists={artists} />
                                    )}
                                </section>
                            ) : (
                                <section
                                    aria-labelledby="artists-empty-hint-heading"
                                    className="mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-2 border-t border-border pt-4 text-center tablet:max-w-3xl"
                                >
                                    <h2
                                        id="artists-empty-hint-heading"
                                        className="sr-only"
                                    >
                                        How to find artists
                                    </h2>
                                    <p
                                        className="text-sm text-text-muted"
                                        role="status"
                                    >
                                        Type something in the search box or use
                                        the filters above—name, category, or location—to discover
                                        artists.
                                    </p>
                                </section>
                            )}
                        </ArtistsBrowseLayout>
                    </div>
                </UpdateCategoriesProvider>
            </FiltersProvider>
        </Web.Container>
    )
}
