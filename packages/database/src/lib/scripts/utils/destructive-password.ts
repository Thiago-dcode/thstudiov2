import { compare } from '@repo/common-lib/utils/hash';

/** Bcrypt hash of the password required to run destructive DB/Stripe/S3 scripts, in any env. */
export const DESTRUCTIVE_PASSWORD_HASH_ENV = 'MIGRATE_REFRESH_PASSWORD_HASH';

/** A valid bcrypt hash is always 60 chars: `$2a$`/`$2b$`/`$2y$` + cost + 53-char salt+digest. */
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * `docker compose` interpolates any `$word` it finds inside `.env` values it loads
 * (not just ones referenced via `${VAR}` in the compose file) — including values only
 * ever used as `env_file` passthrough. A bcrypt hash contains three `$`-delimited
 * segments, so an unescaped hash in `.env` gets silently corrupted (undefined
 * "variables" default to blank) before it ever reaches the container. Every password
 * then fails, even the correct one. Fix by writing every `$` as `$$` in `.env`.
 */
function isWellFormedBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value);
}

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
  if (!isWellFormedBcryptHash(passwordHash)) {
    throw new Error(
      `${DESTRUCTIVE_PASSWORD_HASH_ENV} does not look like a valid bcrypt hash (got ${passwordHash.length} chars, expected 60). ` +
        "If this is running under docker compose, check .env: compose interpolates any $word inside .env values, so every literal '$' in the hash must be escaped as '$$'.",
    );
  }
  return compare(password, passwordHash);
}
