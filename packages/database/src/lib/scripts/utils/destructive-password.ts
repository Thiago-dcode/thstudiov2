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
