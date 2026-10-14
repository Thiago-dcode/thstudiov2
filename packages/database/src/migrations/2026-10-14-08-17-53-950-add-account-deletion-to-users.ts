import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const USERS = TABLES_ENUM.USERS;

/**
 * Self-service account deletion with a grace period. `deletion_requested_at` flags the account:
 * it is hidden from every public surface and a daily cron hard-deletes it once the grace period
 * (`ACCOUNT_DELETION_GRACE_DAYS`) has passed. `deletion_warning_sent_at` marks the "your account
 * will be deleted in 2 days" email so it is sent once per request; reopening the account clears both.
 *
 * The partial index keeps the cron's scan to the handful of flagged rows.
 */
const up = async () => {
  await Schema.raw(`ALTER TABLE ${USERS} ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP NULL`);
  await Schema.raw(`ALTER TABLE ${USERS} ADD COLUMN IF NOT EXISTS deletion_warning_sent_at TIMESTAMP NULL`);
  await Schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_users_deletion_requested_at
    ON ${USERS} (deletion_requested_at)
    WHERE deletion_requested_at IS NOT NULL
  `);
};

const down = async () => {
  await Schema.raw(`DROP INDEX IF EXISTS idx_users_deletion_requested_at`);
  await Schema.raw(`ALTER TABLE ${USERS} DROP COLUMN IF EXISTS deletion_warning_sent_at`);
  await Schema.raw(`ALTER TABLE ${USERS} DROP COLUMN IF EXISTS deletion_requested_at`);
};

export { up, down };
