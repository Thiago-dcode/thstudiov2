import { EnumType } from './enums';

/**
 * Columns `user_notifications` may be ordered by. Same reasoning as the user-contact list: the
 * query builder interpolates the ORDER BY column straight into SQL, so a client-supplied
 * `order_by` has to be validated against this allow-list before it reaches the repository.
 */
export const USER_NOTIFICATION_ORDER_BY_COLUMNS = [
  'created_at',
  'updated_at',
  'read_at',
  'type',
] as const;

export const DEFAULT_USER_NOTIFICATION_ORDER_BY = 'created_at' as const;

/**
 * Upper bound on one `mark as read` batch. The endpoint takes explicit ids rather than a
 * "read everything" flag, so the list is naturally bounded by what a client has on screen —
 * this only stops an oversized `IN (...)` from being built out of a hand-rolled request.
 */
export const MAX_USER_NOTIFICATIONS_READ_BATCH = 100;

/**
 * Media statuses a notification payload may be cached at - the settled ones. An allow-list rather
 * than a deny-list on the in-flight statuses (`UPLOADING`, `UPDATING`): a future transient status
 * fails safe (uncached) instead of being frozen for a whole TTL on a card that never stops
 * spinning.
 */
export const CACHEABLE_MEDIA_STATUSES: readonly EnumType<'MEDIA_STATUS'>[] = [
  'COMPLETED',
  'FAILED',
];
