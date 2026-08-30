import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsPositive,
} from 'class-validator';
import { MAX_USER_NOTIFICATIONS_READ_BATCH } from '@repo/common-lib/constants/user-notification';

/**
 * Explicit ids, never a "mark everything" flag: the client marks what it has actually shown the
 * user, so a notification that arrived after the list was rendered is not silently swallowed.
 *
 * Ownership is not validated here — the repository scopes the write to the authenticated user, so
 * an id belonging to someone else simply matches no row.
 */
export class MarkUserNotificationsAsReadRequest {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_USER_NOTIFICATIONS_READ_BATCH, {
    message: `Up to ${MAX_USER_NOTIFICATIONS_READ_BATCH} notifications can be marked as read at once`,
  })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @Type(() => Number)
  ids: number[];
}
