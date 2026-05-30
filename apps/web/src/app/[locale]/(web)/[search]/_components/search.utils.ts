import type { ArtistIndexRequest } from "@repo/common-lib/types/user";
import type { QueryBuilder } from "@repo/common-lib/utils/query-builder";

export const SEARCH_SEGMENTS = [
  { value: "artists", label: "Artists" },
  { value: "portfolios", label: "Portfolios" },
] as const;

export type SearchSegment = (typeof SEARCH_SEGMENTS)[number]["value"];

export function isSearchSegment(value: string): value is SearchSegment {
  return SEARCH_SEGMENTS.some((segment) => segment.value === value);
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
