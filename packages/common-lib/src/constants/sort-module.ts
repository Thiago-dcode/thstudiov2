/** Most rows one sort request may carry. Explicit positions are `0..MAX_SORT_MODULE_ITEMS - 1`. */
export const MAX_SORT_MODULE_ITEMS = 200;

/**
 * Position of a row nobody has ordered yet. Must equal the migration default
 * (`position INTEGER DEFAULT 999`). Explicit positions always stay below it, so unsorted rows
 * land after the ordered ones.
 */
export const DEFAULT_SORT_POSITION = 999;
