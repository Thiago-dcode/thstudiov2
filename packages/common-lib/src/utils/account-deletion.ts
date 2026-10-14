import { addDays } from 'date-fns';
import { ACCOUNT_DELETION_GRACE_DAYS } from '../constants/limits';

/**
 * When a flagged account is hard-deleted: the request date plus the grace period. Shared so the
 * API (cron, warning email) and the web (modal, settings) always show the same date.
 */
export function accountDeletionDate(requestedAt: Date | string): Date {
  return addDays(new Date(requestedAt), ACCOUNT_DELETION_GRACE_DAYS);
}
