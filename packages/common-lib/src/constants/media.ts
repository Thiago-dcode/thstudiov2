/**
 * Columns a media listing may be ordered by. The query builder interpolates the ORDER BY column
 * straight into SQL, so a client-supplied `order_by` has to be validated against this allow-list
 * before it reaches the repository.
 */
export const MEDIA_ORDER_BY_COLUMNS = ['created_at', 'seo_generated_at'] as const;

export const DEFAULT_MEDIA_ORDER_BY = 'created_at' as const;
