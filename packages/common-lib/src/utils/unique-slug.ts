import { foldLatinDiacritics } from './fold-latin-diacritics';
import { generateValidSlug, isAValidSlugFormat } from './generate-valid-slug';

/** Resolves to `true` when `candidate` is already taken. Callers inject the scope (per-user, global, exclude-self). */
export type SlugExistsPredicate = (candidate: string) => Promise<boolean>;

/** Thrown when no free slug was found within `maxAttempts` candidates. */
export class SlugAllocationError extends Error {
  constructor(base: string, attempts: number) {
    super(`Could not allocate a unique slug for "${base}" after ${attempts} attempts.`);
    this.name = 'SlugAllocationError';
  }
}

const MIN_SLUG_LENGTH = 3;
const DEFAULT_MAX_ATTEMPTS = 100;

/**
 * Derives the base slug from a user-facing title.
 *
 * Diacritics are folded first, so "Ação Café" yields `acao-cafe` rather than the `ao-caf`
 * that {@link generateValidSlug} alone would produce (it strips non-ASCII outright).
 * Titles that slugify to nothing usable — fully non-Latin scripts, emoji, or 1-2 characters —
 * fall back to `fallbackPrefix` so the result always satisfies {@link isAValidSlugFormat}.
 * Uniqueness is not this function's job; pass the result to {@link allocateUniqueSlug}.
 */
export function slugBaseFromTitle(title: string, fallbackPrefix: string): string {
  const base = generateValidSlug(foldLatinDiacritics(title ?? ''));

  if (base.length >= MIN_SLUG_LENGTH) return base;
  if (base.length > 0) return `${base}-${fallbackPrefix}`;
  return fallbackPrefix;
}

/**
 * Returns `base`, or the first free `base-2`, `base-3`, … as decided by `exists`.
 *
 * The predicate carries the scope, so one implementation serves per-user entities and
 * globally scoped ones alike. Read-then-write is inherently racy under concurrency —
 * callers that need a hard guarantee should back this with a unique index and retry.
 */
export async function allocateUniqueSlug(
  base: string,
  exists: SlugExistsPredicate,
  options?: { maxAttempts?: number },
): Promise<string> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  // A valid base can never be suffixed into an invalid slug, so checking it once covers
  // every candidate. An invalid base is a caller bug — fail fast instead of probing 100 times.
  if (!isAValidSlugFormat(base)) {
    throw new SlugAllocationError(base, 0);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (!(await exists(candidate))) return candidate;
  }

  throw new SlugAllocationError(base, maxAttempts);
}
