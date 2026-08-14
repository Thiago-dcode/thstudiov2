import { BadRequestException } from '@nestjs/common';
import {
  allocateUniqueSlug,
  slugBaseFromTitle,
  SlugAllocationError,
  type SlugExistsPredicate,
} from '@repo/common-lib/utils/unique-slug';
import { DbUniqueViolationException } from '@repo/database/exceptions';

/** Seeds the slug when a title carries no usable Latin characters. Also the prefix for collision suffixes. */
export type SlugFallbackPrefix = 'portfolio' | 'service' | 'collection';

/**
 * Derives a user-facing entity's slug from its title and resolves collisions.
 *
 * `exists` carries the scope — for these entities it must always filter on `user_id`,
 * since two artists may legitimately own the same slug (their public URLs differ by username).
 * Call this before building any slug-derived storage path: the returned slug is the final one.
 */
export async function resolveEntitySlug(args: {
  title: string;
  fallbackPrefix: SlugFallbackPrefix;
  exists: SlugExistsPredicate;
}): Promise<string> {
  const base = slugBaseFromTitle(args.title, args.fallbackPrefix);

  try {
    return await allocateUniqueSlug(base, args.exists);
  } catch (error) {
    if (error instanceof SlugAllocationError) {
      throw new BadRequestException(
        'Could not allocate a unique address for this title. Please try a different title.',
      );
    }
    throw error;
  }
}

/**
 * Runs `insert` with the already-allocated `slug`, re-allocating and retrying once if the
 * unique (user_id, slug) index rejects it.
 *
 * {@link resolveEntitySlug} reads before it writes, so two concurrent creates of the same title
 * can both pick the same candidate. The index is what actually enforces uniqueness; this turns
 * the loser's constraint violation into a second allocation that sees the winner's row.
 * The caller passes the first slug in rather than a factory because it has usually already
 * spent it on a storage path.
 */
export async function insertWithUniqueSlug<T>(
  slug: string,
  reallocate: () => Promise<string>,
  insert: (slug: string) => Promise<T>,
): Promise<T> {
  try {
    return await insert(slug);
  } catch (error) {
    if (!(error instanceof DbUniqueViolationException)) throw error;
    return insert(await reallocate());
  }
}
