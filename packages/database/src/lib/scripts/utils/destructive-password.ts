import { timingSafeEqual } from 'node:crypto';

/** Plaintext password required to run destructive DB/Stripe/S3 scripts, in any env. */
export const DESTRUCTIVE_PASSWORD_ENV = 'MIGRATE_REFRESH_PASSWORD';

/**
 * Compares a plaintext password against `MIGRATE_REFRESH_PASSWORD`. Plain string
 * comparison, no hashing — this only gates a manual/local destructive-script step, not
 * stored user data. Each destructive script re-checks this itself (rather than trusting
 * the caller) so it stays safe even if invoked directly.
 */
export function verifyDestructivePassword(password: string): boolean {
  const expected = process.env[DESTRUCTIVE_PASSWORD_ENV];
  return Boolean(expected) && password === expected;
}

/** Plaintext secret required to restore a database backup, in any env. */
export const APP_SECRET_ENV = 'APP_SECRET';

/** Constant-time compare of a typed password against `APP_SECRET`; false when it is unset. */
export function verifyAppSecret(password: string): boolean {
  const expected = process.env[APP_SECRET_ENV];
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
