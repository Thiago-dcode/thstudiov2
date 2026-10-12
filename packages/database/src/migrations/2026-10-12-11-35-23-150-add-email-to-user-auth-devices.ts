import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { Schema } from '../lib/facades';

const USER_AUTH_DEVICES = TABLES_ENUM.USER_AUTH_DEVICES;

/**
 * A device can now be trusted before its user exists: validating a wait-list email proves the
 * address from that browser, so the row is keyed by `email` with `user_id` NULL until the person
 * registers and claims it. Exactly one of the two identifies the row's owner, and an email can
 * hold at most one pre-validated device.
 */
const up = async () => {
  await Schema.raw(`ALTER TABLE ${USER_AUTH_DEVICES} ALTER COLUMN user_id DROP NOT NULL`);
  await Schema.raw(`ALTER TABLE ${USER_AUTH_DEVICES} ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL`);
  await Schema.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_user_auth_devices_email
    ON ${USER_AUTH_DEVICES} (email)
  `);
  await Schema.raw(`
    ALTER TABLE ${USER_AUTH_DEVICES}
    DROP CONSTRAINT IF EXISTS chk_user_auth_devices_owner
  `);
  await Schema.raw(`
    ALTER TABLE ${USER_AUTH_DEVICES}
    ADD CONSTRAINT chk_user_auth_devices_owner CHECK (user_id IS NOT NULL OR email IS NOT NULL)
  `);
};

const down = async () => {
  // Unclaimed pre-validated devices have no user and cannot survive NOT NULL again.
  await Schema.raw(`DELETE FROM ${USER_AUTH_DEVICES} WHERE user_id IS NULL`);
  await Schema.raw(`
    ALTER TABLE ${USER_AUTH_DEVICES}
    DROP CONSTRAINT IF EXISTS chk_user_auth_devices_owner
  `);
  await Schema.raw(`DROP INDEX IF EXISTS uq_user_auth_devices_email`);
  await Schema.raw(`ALTER TABLE ${USER_AUTH_DEVICES} DROP COLUMN IF EXISTS email`);
  await Schema.raw(`ALTER TABLE ${USER_AUTH_DEVICES} ALTER COLUMN user_id SET NOT NULL`);
};

export { up, down };
