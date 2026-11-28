import type { ApiResponse } from "@repo/common-lib/types/response";

/** The highlight card grid shared by the list and tab layouts. */
export const SECTION_GRID_CLASS =
  "grid grid-cols-2 gap-x-6 gap-y-10 tablet:grid-cols-3 tablet-lg:grid-cols-4 tablet-lg:gap-x-10 tablet-lg:gap-y-14 laptop:grid-cols-5";

/** True when the section holds more items than the profile shows, so "view all" has somewhere to go. */
export const hasMoreThan = (res: ApiResponse<unknown[]>, max: number) =>
  res.error === null && (res.pagination?.total_count ?? 0) > max;
