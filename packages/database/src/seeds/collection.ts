/**
 * Creates one or more collections for a user (`amount`, default 1): faker title/description/slug,
 * `is_highlight: true`, and 15 random `media` rows per collection linked via `collection_media`.
 *
 * Unlike {@link ./portfolio.ts portfolios}, `collections` have no stored thumbnail; the API
 * derives visuals from joined `media` (`CollectionService` / `CollectionRepository`).
 *
 * Default username is `thsworld` (same as `media.ts` / `portfolio.ts` / `admin-user`).
 *
 * CLI:
 *   pnpm dbcli db:seed -n collection
 *
 * Programmatic:
 *   await seedCollection();
 *   await seedCollection('otheruser', 5);
 *
 * Outside local app env (`development` / `local` / `test`), the seed **exits without error**
 * (skipped). Prerequisites when run: user exists; at least 15 `media` rows for that user
 * (e.g. `pnpm dbcli db:seed -n media` for `thsworld`).
 */

import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import { Query } from '../lib/facades';

const MEDIA_RELATION_COUNT = 15;

/** Same default as `media.ts` / `portfolio.ts` / `admin-user`. */
const COLLECTION_SEED_USERNAME = 'thsworld';

const ALLOWED_APP_ENVS = ['development', 'local', 'test'] as const;

function isCollectionSeedAllowedEnv(): boolean {
  const env = getConfigValue('app').env.toLowerCase();
  return ALLOWED_APP_ENVS.includes(
    env as (typeof ALLOWED_APP_ENVS)[number],
  );
}

function resolveSeedAmount(amount?: number): number {
  if (amount === undefined) {
    return 1;
  }
  const n = Math.floor(Number(amount));
  if (!Number.isFinite(n) || n < 1) {
    throw new Error('amount must be a positive integer (omit for default 1).');
  }
  return n;
}

type SeedUser = {
  id: number;
  public_id: string;
  username: string;
};

async function slugUniqueForUser(
  slug: string,
  userId: number,
): Promise<boolean> {
  const exists = await Query.table(TABLES_ENUM.COLLECTIONS)
    .where('slug', '=', slug)
    .where('user_id', '=', userId)
    .exists();
  return !exists;
}

async function pickUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed-only; matches dynamic `import('@faker-js/faker')`.
  faker: any,
  userId: number,
): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const words = faker.lorem.words(faker.number.int({ min: 2, max: 4 }));
    let slug = generateValidSlug(words);
    if (slug.length < 3) {
      slug = `col-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}`;
    }
    if (attempt > 0) {
      slug = `${slug}-${faker.string.alphanumeric({ length: 4, casing: 'lower' })}`;
    }
    if (await slugUniqueForUser(slug, userId)) {
      return slug;
    }
  }
  throw new Error('Could not generate a unique collection slug for this user.');
}

async function seedCollectionForUsername(
  username: string,
  amount: number,
): Promise<void> {
  const { faker } = await import('@faker-js/faker');

  const user = await Query.table(TABLES_ENUM.USERS)
    .where('username', '=', username)
    .first<SeedUser>();

  if (!user) {
    throw new Error(
      `User with username "${username}" not found. Seed the user first or pass an existing username to main().`,
    );
  }

  const mediaRows = (await Query.table(TABLES_ENUM.MEDIA)
    .select(['id'])
    .where('user_id', '=', user.id)
    .get()) as { id: number }[];

  const mediaIds = mediaRows.map((r) => r.id);
  if (mediaIds.length < MEDIA_RELATION_COUNT) {
    throw new Error(
      `User "${username}" has ${mediaIds.length} media row(s); need at least ${MEDIA_RELATION_COUNT}. Run db:seed -n media (or create more media) first.`,
    );
  }

  const createdIds: number[] = [];

  for (let k = 0; k < amount; k += 1) {
    const title = faker.lorem.sentence({ min: 4, max: 8 }).slice(0, 255);
    const description = faker.lorem.paragraphs({ min: 2, max: 4 });
    const slug = await pickUniqueSlug(faker, user.id);

    const picked = faker.helpers.shuffle([...mediaIds]).slice(0, MEDIA_RELATION_COUNT);

    const collectionRow: Record<string, string | number | boolean> = {
      title,
      slug,
      description,
      is_featured: false,
      is_highlight: true,
      is_active: true,
      user_id: user.id,
    };

    const { id: collectionId } = await Query.table(TABLES_ENUM.COLLECTIONS).insertAndGet(
      Object.keys(collectionRow),
      Object.values(collectionRow),
      ['id'],
    );

    createdIds.push(collectionId);

    for (let i = 0; i < picked.length; i += 1) {
      await Query.table(TABLES_ENUM.COLLECTION_MEDIA).insert(
        ['collection_id', 'media_id', 'position'],
        [collectionId, picked[i], i],
      );
    }
  }

  const extra = await Query.table(TABLES_ENUM.USER_EXTRA_DATA)
    .where('user_id', '=', user.id)
    .first<{ collections_count: number }>();

  if (extra) {
    await Query.table(TABLES_ENUM.USER_EXTRA_DATA)
      .where('user_id', '=', user.id)
      .update(
        ['collections_count'],
        [extra.collections_count + amount],
      );
  } else {
    Logger.warn(
      `No user_extra_data row for user_id=${user.id}; skipped collections_count bump.`,
    );
  }

  Logger.success(
    `Collection seed: created ${amount} collection(s) for user=${username} (ids: ${createdIds.join(', ')}).`,
  );
  await LogService.flush();
}

/**
 * @param username - When omitted or empty, uses {@link COLLECTION_SEED_USERNAME} (same pattern as `portfolio.ts` / `media.ts`).
 * @param amount - How many collections to create; default 1.
 */
export const main = async (username?: string, amount?: number) => {
  if (!isCollectionSeedAllowedEnv()) {
    Logger.info(
      'Collection seed skipped: not a local app env (set NODE_ENV to development, local, or test).',
    );
    await LogService.flush();
    return;
  }
  const resolved = username?.trim() || COLLECTION_SEED_USERNAME;
  const n = resolveSeedAmount(amount);
  await seedCollectionForUsername(resolved, n);
};
