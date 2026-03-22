import { ArtistCard, ArtistIndexRequest } from "@repo/common-lib/types/user"
import { CategoryBase } from "@repo/common-lib/types/category"
import { Metadata } from "next"
import usersService from "@/modules/users/users.service"
import { UpdateCategoriesProvider } from "@/modules/categories/providers/categories.provider"
import { PrimaryFilterComponent } from "./_components/primary-filter-component"
import FilterSearch from "./_components/filter-search"
import { FiltersProvider } from "./_components/filters.provider"
import categoriesService from "@/modules/categories/categories.service"

export const metadata: Metadata = {
    title: "Artists — A11STUDIO",
    description:
        "Browse artists on A11STUDIO. Discover portfolios, services, and creative professionals.",
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

    return {
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
    }
}

function artistDisplayName(a: ArtistCard): string {
    const full = [a.name, a.surname].filter(Boolean).join(" ").trim()
    return full || a.username
}

function artistLocation(a: ArtistCard): string | null {
    const addr = a.address
    if (!addr) return null
    const parts = [addr.city, addr.state, addr.country].filter(
        (x): x is string => Boolean(x?.trim()),
    )
    return parts.length ? parts.join(", ") : null
}

export default async function ArtistsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const artistRequest = buildArtistIndexRequest(params)
    const artistsResult = await usersService.findAll(artistRequest)
    const artists: ArtistCard[] =
        artistsResult.error || !artistsResult.data ? [] : artistsResult.data
    let categories: CategoryBase[] = []
    if (artistRequest.categories?.length) {
        const categoriesResult = await categoriesService.getAll({
            categories: artistRequest.categories
        })
        categories = categoriesResult.data || []
    }
    return (
        <div className="w-full flex justify-center px-5 tablet:px-10 py-16 tablet:py-24">
            <FiltersProvider params={artistRequest} defaultCategoriesSelected={categories}>
                <UpdateCategoriesProvider
                    userCategories={categories}
                >
                    <div className="flex w-full max-w-4xl flex-col gap-8">
                        <FilterSearch />
                        <PrimaryFilterComponent />
                        <section
                            aria-labelledby="artists-results-heading"
                            className="flex w-full flex-col gap-4 border-t border-fg-2/25 pt-8"
                        >
                            <h2
                                id="artists-results-heading"
                                className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted"
                            >
                                Artists
                            </h2>
                            {artistsResult.error ? (
                                <p className="text-sm text-destructive" role="alert">
                                    {artistsResult.error.message ||
                                        "Could not load artists."}
                                </p>
                            ) : artists.length === 0 ? (
                                <p className="text-sm text-text-muted">
                                    No artists match these filters yet.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {artists.map((a) => {
                                        const loc = artistLocation(a)
                                        return (
                                            <li
                                                key={a.id}
                                                className="rounded-md border border-fg-2/30 bg-bg-2/20 px-4 py-3"
                                            >
                                                <p className="text-sm font-medium text-fg-2">
                                                    {artistDisplayName(a)}
                                                </p>
                                                {a.profession ? (
                                                    <p className="mt-0.5 text-xs text-text-muted">
                                                        {a.profession}
                                                    </p>
                                                ) : null}
                                                {loc ? (
                                                    <p className="mt-1 text-[11px] text-text-muted/90">
                                                        {loc}
                                                    </p>
                                                ) : null}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </section>
                    </div>
                </UpdateCategoriesProvider>
            </FiltersProvider>
        </div>
    )
}
