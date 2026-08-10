import { compare } from '@repo/common-lib/utils/hash';

/** Bcrypt hash of the password required to run destructive DB/Stripe/S3 scripts, in any env. */
export const DESTRUCTIVE_PASSWORD_HASH_ENV = 'MIGRATE_REFRESH_PASSWORD_HASH';

/**
 * Verifies a plaintext password against the bcrypt hash configured in
 * `MIGRATE_REFRESH_PASSWORD_HASH`. Each destructive script re-checks this itself
 * (rather than trusting the caller) so it stays safe even if invoked directly.
 */
export async function verifyDestructivePassword(password: string): Promise<boolean> {
  const passwordHash = process.env[DESTRUCTIVE_PASSWORD_HASH_ENV];
  if (!passwordHash) {
    return false;
  }
  return compare(password, passwordHash);
}
