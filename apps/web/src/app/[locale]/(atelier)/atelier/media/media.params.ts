import { SQL_ORDER_DIRECTIONS } from "@repo/common-lib/constants/database";
import type { EnumType } from "@repo/common-lib/constants/enums";
import { ENUMS } from "@repo/common-lib/constants/enums";
import {
  DEFAULT_MEDIA_ORDER_BY,
  MEDIA_ORDER_BY_COLUMNS,
} from "@repo/common-lib/constants/media";
import type { SqlOrderDirection } from "@repo/common-lib/types/database";
import type { MediaOrderBy } from "@repo/common-lib/types/media";
import { optionalTrim } from "@repo/common-lib/utils/parse-params";

/**
 * Shared between the server page (which reads the URL) and the filter bar (which writes it), so
 * both agree on what a value means and which ones are left out of the URL as defaults.
 */
export const MEDIA_PATH = "/atelier/media";
export const DEFAULT_MEDIA_PER_PAGE = 25;
export const DEFAULT_MEDIA_ORDER: SqlOrderDirection = "DESC";

export type MediaShapeFilter = EnumType<"MEDIA_SHAPE">;
export type MediaTypeFilter = EnumType<"MEDIA_TYPE">;

export type MediaListQuery = {
  search?: string;
  shape?: MediaShapeFilter;
  media_type?: MediaTypeFilter;
  order_by: MediaOrderBy;
  order: SqlOrderDirection;
  per_page?: number;
};

function oneOf<T extends string>(
  options: readonly T[],
  value: string | null | undefined,
): T | undefined {
  return value && options.includes(value as T) ? (value as T) : undefined;
}

/** Reads the list query from URL params; anything unknown falls back to the default. */
export function parseMediaListQuery(
  get: (key: string) => string | null | undefined,
): MediaListQuery {
  const perPage = Number.parseInt(get("per_page") ?? "", 10);
  return {
    search: optionalTrim(get("search") ?? undefined),
    shape: oneOf(ENUMS.MEDIA_SHAPE, get("shape")),
    media_type: oneOf(ENUMS.MEDIA_TYPE, get("media_type")),
    order_by:
      oneOf(MEDIA_ORDER_BY_COLUMNS, get("order_by")) ?? DEFAULT_MEDIA_ORDER_BY,
    order:
      oneOf(SQL_ORDER_DIRECTIONS, get("order")?.toUpperCase()) ??
      DEFAULT_MEDIA_ORDER,
    per_page: Number.isFinite(perPage) && perPage > 0 ? perPage : undefined,
  };
}

/**
 * The URL params for a list query. Defaults are left out so the plain `/atelier/media` URL stays
 * canonical, and `page` is never carried over: a new filter or sort starts from page 1.
 */
export function mediaListQueryParams(
  query: MediaListQuery,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.search) params.search = query.search;
  if (query.shape) params.shape = query.shape;
  if (query.media_type) params.media_type = query.media_type;
  if (query.order_by !== DEFAULT_MEDIA_ORDER_BY)
    params.order_by = query.order_by;
  if (query.order !== DEFAULT_MEDIA_ORDER) params.order = query.order;
  if (query.per_page && query.per_page !== DEFAULT_MEDIA_PER_PAGE) {
    params.per_page = String(query.per_page);
  }
  return params;
}
