/**
 * One-click orderings the artist can apply to a sortable module list before saving it. Pure: the
 * result is only a new id order; the list saves it through the normal "Update order" button.
 */
export const MODULE_AUTO_ORDERS = [
  "newest",
  "oldest",
  "recentlyUpdated",
  "leastRecentlyUpdated",
] as const;

export type ModuleAutoOrder = (typeof MODULE_AUTO_ORDERS)[number];

/** Timestamps arrive as ISO strings over JSON even though the shared types say `Date`. */
export type DatedModuleItem = {
  id: number;
  created_at: Date | string;
  updated_at: Date | string;
};

const RULES: Record<
  ModuleAutoOrder,
  { key: "created_at" | "updated_at"; direction: 1 | -1 }
> = {
  newest: { key: "created_at", direction: -1 },
  oldest: { key: "created_at", direction: 1 },
  recentlyUpdated: { key: "updated_at", direction: -1 },
  leastRecentlyUpdated: { key: "updated_at", direction: 1 },
};

/** Milliseconds, or 0 for a missing or unparseable value, so a bad date never throws. */
const toTime = (value: Date | string): number => {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

/** Ids in the chosen order. Ties fall back to id ascending, so the result is deterministic. */
export const autoOrderIds = (
  items: readonly DatedModuleItem[],
  order: ModuleAutoOrder,
): number[] => {
  const { key, direction } = RULES[order];
  return [...items]
    .sort(
      (a, b) => (toTime(a[key]) - toTime(b[key])) * direction || a.id - b.id,
    )
    .map((item) => item.id);
};
