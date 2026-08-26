/**
 * Columns `user_contacts` may be ordered by. The query builder interpolates the ORDER BY column
 * straight into SQL, so an allow-list is the only thing keeping a client-supplied `order_by` from
 * being an injection point — validate against this on the API before it reaches the repository.
 */
export const USER_CONTACT_ORDER_BY_COLUMNS = [
  'created_at',
  'updated_at',
  'contact_name',
  'contact_email',
  'subject',
] as const;

export const DEFAULT_USER_CONTACT_ORDER_BY = 'created_at' as const;
