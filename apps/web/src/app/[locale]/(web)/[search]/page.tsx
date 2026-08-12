import type { CategoryBase } from "@repo/common-lib/types/category";
import type { PortfolioIndexRequest } from "@repo/common-lib/types/portfolio";
import type { Pagination } from "@repo/common-lib/types/response";
import type { ArtistIndexRequest } from "@repo/common-lib/types/user";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { AppPagination } from "@repo/ui/components/custom/app-pagination";
import { cn } from "@repo/ui/lib/utils";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Web from "@/lib/components/web-page.component";
import { buildStaticPageMetadata } from "@/lib/seo/static-metadata";
import categoriesService from "@/modules/categories/categories.service";
import { UpdateCategoriesProvider } from "@/modules/categories/providers/categories.provider";
import portfolioService from "@/modules/portfolios/portfolio.service";
import usersService from "@/modules/users/users.service";
import { ArtistsGrid } from "./_components/artists-grid";
import { FilterSearch } from "./_components/filter-search";
import { FiltersProvider } from "./_components/filters.provider";
import { NearMeSessionCleaner } from "./_components/near-me-session-cleaner";
import { PortfoliosGrid } from "./_components/portfolios-grid";
import {
  buildSearchRequest,
  filtersToQuery,
  isSearchSegment,
  type SearchResult,
  type SearchSegment,
} from "./_components/search.utils";
import { SearchNearMeButton } from "./_components/search-near-me-button";
import { SearchSegmentToggle } from "./_components/search-segment-toggle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; search: string }>;
}) {
  const { locale, search } = await params;
  const t = await getTranslations("search");
  if (!isSearchSegment(search)) {
    return {
      title: { absolute: t("page.title") },
      robots: { index: false, follow: false },
    };
  }
  // Canonical points at the clean segment URL (no query string), so all filtered/param variants
  // (`?search=`, `?categories=`, geo filters) consolidate here instead of bloating the index.
  return buildStaticPageMetadata({
    path: `/${search}`,
    title: t("page.title"),
    titleAbsolute: true,
    description: t("page.description"),
    locale,
  });
}

/**
 * Always fetches, filters or not.
 *
 * `/artists` and `/portfolios` — the canonical, indexable, sitemap-listed directory URLs — used to
 * short-circuit to an empty result whenever there was no query string, so the bare URLs served a
 * 200 with zero results, zero pagination and zero links. They were indexable dead ends and the
 * only crawlable entry point into the artist and portfolio pages, which meant the entire catalogue
 * hung off links that were never rendered. Fetching the unfiltered first page turns both into real
 * hub pages.
 */
async function fetchSearchResults(
  segment: SearchSegment,
  request: ArtistIndexRequest,
): Promise<SearchResult> {
  const paginatedRequest = {
    ...request,
    per_page: Math.min(request.per_page || 30, 50),
    page: request.page || 1,
    paginated: true,
  };

  if (segment === "portfolios") {
    const portfolioRequest: PortfolioIndexRequest = {
      ...paginatedRequest,
      is_active: true,
    };
    const response = await portfolioService.findAll(portfolioRequest);
    const items =
      !response || response.error || !response.data ? [] : response.data;
    return { type: "portfolios", items, response };
  }

  const response = await usersService.findAll(paginatedRequest);
  const items =
    !response || response.error || !response.data ? [] : response.data;
  return { type: "artists", items, response };
}

export default async function SearchPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ search: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Load translations for the search namespace
  const t = await getTranslations("search");

  const { search } = await routeParams;
  if (!isSearchSegment(search)) {
    notFound();
  }

  const params = await searchParams;
  const sharedRequest = buildSearchRequest(params);
  const hasLocationFilter =
    sharedRequest.lat != null ||
    sharedRequest.lng != null ||
    sharedRequest.radius_km != null;

  const result = await fetchSearchResults(search, sharedRequest);

  const pagination: Pagination | undefined =
    result.response && !result.response.error
      ? (result.response.pagination ?? undefined)
      : undefined;
  const totalCount = pagination?.total_count ?? result.items.length;

  const buildPaginationHref = (page: number) =>
    queryParamBuilder(
      `/${search}`,
      filtersToQuery({ ...sharedRequest, page }),
      { arrayStyle: "commas" },
    );
  let categories: CategoryBase[] = [];
  if (sharedRequest.categories?.length) {
    const categoriesResult = await categoriesService.getAll({
      slugs: sharedRequest.categories,
    });
    categories = categoriesResult.data || [];
  }
  const searchQuery = sharedRequest.search?.trim();
  const resultsForSearchSuffix =
    searchQuery !== undefined && searchQuery !== ""
      ? t("page.results.forQuery", { query: searchQuery })
      : "";

  // Determine the segment label for translations (artists/portfolios)
  const segmentLabel =
    search === "artists" ? t("segments.artists") : t("segments.portfolios");

  const errorMessage =
    result.response?.error?.message || t("page.errorMessage"); // fallback

  return (
    <Web.Container className={cn("flex h-full w-full flex-col justify-start")}>
      <div className="mb-4 flex flex-col items-start gap-3 tablet:mb-6 tablet:flex-row tablet:items-center tablet:justify-between">
        <Web.Header
          title={`${t("page.searchingFor", { segment: segmentLabel })}`}
          titleClassName="text-2xl tablet:text-3xl desktop:text-4xl"
        />
        <SearchSegmentToggle active={search} filters={sharedRequest} />
      </div>
      <FiltersProvider
        segment={search}
        params={sharedRequest}
        defaultCategoriesSelected={categories}
      >
        <UpdateCategoriesProvider userCategories={categories}>
          <div>
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
                  {t("page.errorHeading", { segment: segmentLabel })}
                </h2>
                <p className="text-sm text-text-muted">{errorMessage}</p>
              </section>
            ) : result.items.length ? (
              <section
                aria-labelledby="search-results-heading"
                className="flex w-full flex-col gap-4 pt-4"
              >
                {/* h2, not h5: the page's only other headings are h1 (Web.Header) and the h2s in
                    the sibling error/empty branches — an h5 here skipped three levels. */}
                <h2
                  id="search-results-heading"
                  className="text-sm font-medium tracking-wide text-text-muted"
                >
                  {/* Pluralization handled by next-intl in the translation key */}
                  {search === "portfolios"
                    ? t("page.results.foundPortfolios", {
                        count: totalCount,
                        suffix: resultsForSearchSuffix,
                      })
                    : t("page.results.foundArtists", {
                        count: totalCount,
                        suffix: resultsForSearchSuffix,
                      })}
                </h2>
                <div className="flex flex-col gap-4">
                  {result.type === "artists" && (
                    <ArtistsGrid artists={result.items} />
                  )}
                  {result.type === "portfolios" && (
                    <PortfoliosGrid portfolios={result.items} />
                  )}
                  {pagination && (
                    <AppPagination
                      pagination={pagination}
                      buildHref={buildPaginationHref}
                      labels={{
                        previous: t("pagination.previous"),
                        next: t("pagination.next"),
                        previousAria: t("pagination.previousAria"),
                        nextAria: t("pagination.nextAria"),
                      }}
                    />
                  )}
                </div>
              </section>
            ) : (
              <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-4 pt-8 text-center tablet:max-w-3xl">
                {/* Shown unconditionally now: with the unfiltered fetch in place, an empty result
                    means the catalogue really is empty, and a 200 with no text at all is exactly
                    the thin page a crawler penalises. */}
                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-sm font-medium tracking-wide text-text">
                    {t("page.empty.heading", {
                      segment: segmentLabel,
                      suffix: resultsForSearchSuffix,
                    })}
                  </h2>
                  <output className="text-sm text-text-muted">
                    {t("page.empty.output", {
                      segment: segmentLabel,
                      end: hasLocationFilter
                        ? "."
                        : ` ${t("page.empty.lookNear", { segment: segmentLabel })}`,
                    })}
                  </output>
                </div>
                {!hasLocationFilter && (
                  <SearchNearMeButton clearPreviousFilters />
                )}
              </section>
            )}
          </div>
        </UpdateCategoriesProvider>
      </FiltersProvider>
    </Web.Container>
  );
}
