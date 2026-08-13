/**
 * Platform support user (role `SUPPORT`).
 *
 * Prerequisites: run the default seed first (`pnpm dbcli db:seed`) so `roles` exist.
 *
 * Usage:
 *   pnpm dbcli db:seed -n support-user
 *
 * Required env (no defaults — the seed throws if any is unset):
 *   SUPPORT_EMAIL=... SUPPORT_USERNAME=... SUPPORT_PASSWORD=... pnpm dbcli db:seed -n support-user
 *
 * Re-running skips if the email or username is already taken.
 */

import { hash } from '@repo/common-lib/utils/hash';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import { randomUUID } from 'node:crypto';
import { requireEnv } from '@repo/common-lib/utils/require-env';
import { normalizeUsername } from '@repo/common-lib/utils/username';
import { Query } from '../lib/facades';

const SUPPORT_EMAIL = requireEnv('SUPPORT_EMAIL');
export const SUPPORT_USERNAME = normalizeUsername(requireEnv('SUPPORT_USERNAME'));
const SUPPORT_PASSWORD = requireEnv('SUPPORT_PASSWORD');

export const main = async () => {
  const emailTaken = await Query.table(TABLES_ENUM.USERS)
    .where('email', '=', SUPPORT_EMAIL)
    .exists();
  const usernameTaken = await Query.table(TABLES_ENUM.USERS)
    .where('username', '=', SUPPORT_USERNAME)
    .exists();

  if (emailTaken || usernameTaken) {
    Logger.info(
      `Support seed skipped: email or username already in use (${SUPPORT_EMAIL} / ${SUPPORT_USERNAME}).`,
    );
    await LogService.flush();
    return;
  }

  const supportRole = await Query.table(TABLES_ENUM.ROLES)
    .where('name', '=', 'SUPPORT')
    .first<{ id: number }>();

  if (!supportRole) {
    throw new Error(
      'SUPPORT role not found. Run the default seed (`pnpm dbcli db:seed`) first.',
    );
  }

  const passwordHash = await hash(SUPPORT_PASSWORD);

  const userRow: Record<string, string | number | boolean | null> = {
    public_id: randomUUID(),
    name: 'Support',
    surname: null,
    username: SUPPORT_USERNAME,
    email: SUPPORT_EMAIL,
    stripe_customer_id: null,
    password: passwordHash,
    biography: null,
    profession: null,
    short_biography: null,
    email_validated: true,
    is_active: true,
    banned: false,
    banned_reason: null,
    funnel_step: 1,
    number_email_validations_sent: 0,
    twofa_enabled: false,
    twofa_code: null,
    twofa_expires_at: null,
    twofa_attempts: 0,
    username_reset_count: 0,
    password_reset_count: 0,
    next_username_reset: null,
    next_password_reset: null,
    role_id: supportRole.id,
  };

  const { id: userId } = await Query.table(TABLES_ENUM.USERS).insertAndGet(
    Object.keys(userRow),
    Object.values(userRow),
    ['id'],
  );

  Logger.success(
    `Support user seeded: id=${userId} email=${SUPPORT_EMAIL} username=${SUPPORT_USERNAME}`,
  );
  await LogService.flush();
};
