import type { Portfolio } from "@repo/common-lib/types/portfolio";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type {
 ArtistCard,
 ArtistIndexRequest,
} from "@repo/common-lib/types/user";
import {
 firstString,
 optionalTrim,
 parseOptionalFloat,
 parseOptionalInt,
} from "@repo/common-lib/utils/parse-params";
import type { QueryBuilder } from "@repo/common-lib/utils/query-builder";

export const SEARCH_SEGMENTS = [
 { value: "artists", label: "Artists" },
 { value: "portfolios", label: "Portfolios" },
] as const;

export type SearchSegment = (typeof SEARCH_SEGMENTS)[number]["value"];

export type SearchResult =
 | {
 type: "artists";
 items: ArtistCard[];
 response: ApiResponse<ArtistCard[]> | null;
 }
 | {
 type: "portfolios";
 items: Portfolio[];
 response: ApiResponse<Portfolio[]> | null;
 };

export function isSearchSegment(value: string): value is SearchSegment {
 return SEARCH_SEGMENTS.some((segment) => segment.value === value);
}

export function buildSearchRequest(
 params: Record<string, string | string[] | undefined>,
): ArtistIndexRequest {
 const search = optionalTrim(firstString(params.search));
 const page = parseOptionalInt(firstString(params.page));
 const per_page = parseOptionalInt(firstString(params.per_page));
 const country = optionalTrim(firstString(params.country));
 const state = optionalTrim(firstString(params.state));
 const city = optionalTrim(firstString(params.city));
 const lat = parseOptionalFloat(firstString(params.lat));
 const lng = parseOptionalFloat(firstString(params.lng));
 const radius_km = parseOptionalInt(firstString(params.radius_km));

 const categoriesRaw = firstString(params.categories);
 const categories = categoriesRaw
 ? categoriesRaw
 .split(",")
 .map((c) => c.trim())
 .filter(Boolean)
 : undefined;

 const out: ArtistIndexRequest = {};
 if (search !== undefined) out.search = search;
 if (page !== undefined) out.page = page;
 if (per_page !== undefined) out.per_page = per_page;
 if (country !== undefined) out.country = country;
 if (state !== undefined) out.state = state;
 if (city !== undefined) out.city = city;
 if (lat !== undefined) out.lat = lat;
 if (lng !== undefined) out.lng = lng;
 if (radius_km !== undefined) out.radius_km = radius_km;
 if (categories?.length) out.categories = categories;

 return out;
}

export function filtersToQuery(filters: ArtistIndexRequest): QueryBuilder {
 const out: QueryBuilder = {};
 if (filters.page != null) out.page = filters.page;
 if (filters.per_page != null) out.per_page = filters.per_page;
 const search = filters.search?.trim();
 if (search) out.search = search;
 if (filters.categories?.length) out.categories = filters.categories;
 const country = filters.country?.trim();
 if (country) out.country = country;
 const state = filters.state?.trim();
 if (state) out.state = state;
 const city = filters.city?.trim();
 if (city) out.city = city;
 if (filters.lat != null) out.lat = filters.lat;
 if (filters.lng != null) out.lng = filters.lng;
 if (filters.radius_km != null) out.radius_km = filters.radius_km;
 return out;
}
