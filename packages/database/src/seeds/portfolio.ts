/**
 * Creates one or more portfolios for a user (`amount`, default 1): faker title/description/slug,
 * `is_highlight: true`, thumbnail from a random file in `src/seeds/media-images/` (uploaded to S3
 * like API `PortfolioService` / `Helpers.setAsset` sizing), and 20 random `media` rows per portfolio
 * linked via `portfolio_media`.
 *
 * Default username is `thsworld` (same as `media.ts` / `admin-user`).
 *
 * CLI (default user `thsworld`):
 *   pnpm dbcli db:seed -n portfolio
 *
 * Programmatic:
 *   await seedPortfolio(); // username default + amount 1
 *   await seedPortfolio('otheruser', 5);
 *
 * Prerequisites: local app env; S3 (`STORAGE_*`); `media-images/`; user exists;
 * at least 20 `media` rows for that user (run `db:seed -n media` first for `thsworld`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import type { S3StorageConfig } from '@repo/backend-lib/services/storage-service/types';
import { LogService } from '@repo/backend-lib/services/log-service';
import Logger from '@repo/backend-lib/utils/console';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { generateValidSlug } from '@repo/common-lib/utils/generate-valid-slug';
import { Query } from '../lib/facades';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MEDIA_RELATION_COUNT = 20;

/** Same default as `media.ts` (`MEDIA_SEED_USERNAME`) / `admin-user` (`SEED_ADMIN_USERNAME`). */
const PORTFOLIO_SEED_USERNAME = 'thsworld';

const ALLOWED_APP_ENVS = ['development', 'local', 'test'] as const;

function assertLocalAppEnv(): void {
  const env = getConfigValue('app').env.toLowerCase();
  if (
    !ALLOWED_APP_ENVS.includes(env as (typeof ALLOWED_APP_ENVS)[number])
  ) {
    throw new Error(
      `Portfolio seed is only allowed in local environments (${ALLOWED_APP_ENVS.join(', ')}). Current app env: "${env}".`,
    );
  }
}

function resolveMediaImagesDir(): string {
  const dir = path.join(process.cwd(), 'src', 'seeds', 'media-images');
  if (fs.existsSync(dir)) {
    return dir;
  }
  throw new Error(
    `media-images folder not found at ${dir}. Run dbcli from packages/database.`,
  );
}

function listImageFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()));
}

function mimeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

function multerLike(buffer: Buffer, originalname: string, mimetype: string) {
  return {
    fieldname: 'thumbnail',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
  };
}

function buildS3Config(): S3StorageConfig {
  const STORAGE_CONFIG = getConfigValue('storage');
  if (
    !STORAGE_CONFIG.bucket ||
    !STORAGE_CONFIG.region ||
    !STORAGE_CONFIG.accessKeyId ||
    !STORAGE_CONFIG.secretAccessKey
  ) {
    throw new Error(
      'S3 storage is not configured. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ACCESS_KEY, STORAGE_SECRET_ACCESS_KEY.',
    );
  }
  return {
    driver: 's3',
    bucket: STORAGE_CONFIG.bucket,
    region: STORAGE_CONFIG.region,
    accessKeyId: STORAGE_CONFIG.accessKeyId,
    secretAccessKey: STORAGE_CONFIG.secretAccessKey,
    signedUrlExpiration: STORAGE_CONFIG.signedUrlExpiration,
  };
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
  const exists = await Query.table(TABLES_ENUM.PORTFOLIOS)
    .where('slug', '=', slug)
    .where('user_id', '=', userId)
    .exists();
  return !exists;
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

async function pickUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- seed-only; matches dynamic `import('@faker-js/faker')`.
  faker: any,
  userId: number,
): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const words = faker.lorem.words(faker.number.int({ min: 2, max: 4 }));
    let slug = generateValidSlug(words);
    if (slug.length < 3) {
      slug = `pf-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}`;
    }
    if (attempt > 0) {
      slug = `${slug}-${faker.string.alphanumeric({ length: 4, casing: 'lower' })}`;
    }
    if (await slugUniqueForUser(slug, userId)) {
      return slug;
    }
  }
  throw new Error('Could not generate a unique portfolio slug for this user.');
}

async function seedPortfolioForUsername(
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

  const mediaDir = resolveMediaImagesDir();
  const imageNames = listImageFiles(mediaDir);
  if (imageNames.length === 0) {
    throw new Error(`No images in ${mediaDir}; need at least one for the portfolio thumbnail.`);
  }

  const s3Config = buildS3Config();
  const storageService = FactoryStorageService.create(s3Config);
  const compressService = FactoryCompressService.create({ driver: 'sharp' });
  const targetThumbBytes = Math.floor(0.5 * 1024 * 1024);

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
    const thumbName = faker.helpers.arrayElement(imageNames);
    const thumbPathFs = path.join(mediaDir, thumbName);
    const thumbBuffer = fs.readFileSync(thumbPathFs);
    const thumbMime = mimeForPath(thumbPathFs);
    const thumbSource = multerLike(thumbBuffer, thumbName, thumbMime);

    const title = faker.lorem.sentence({ min: 4, max: 8 }).slice(0, 255);
    const description = faker.lorem.paragraphs({ min: 2, max: 4 });
    const slug = await pickUniqueSlug(faker, user.id);

    const thumbnailStoragePath = `users/${user.public_id}/portfolio/${slug}/thumbnail.webp`;

    const compressedThumb = await compressService.optimizeImageToWebp(
      thumbSource as Parameters<
        typeof compressService.optimizeImageToWebp
      >[0],
      thumbSource.size > targetThumbBytes ? targetThumbBytes : thumbSource.size,
      85,
    );
    const thumbFile = multerLike(
      compressedThumb.buffer,
      compressedThumb.filename,
      'image/webp',
    );
    await storageService.write(
      thumbFile as Parameters<typeof storageService.write>[0],
      thumbnailStoragePath,
    );

    const picked = faker.helpers.shuffle([...mediaIds]).slice(0, MEDIA_RELATION_COUNT);

    const portfolioRow: Record<string, string | number | boolean> = {
      title,
      slug,
      thumbnail: thumbnailStoragePath,
      description,
      is_featured: false,
      is_highlight: true,
      is_active: true,
      user_id: user.id,
    };

    const { id: portfolioId } = await Query.table(TABLES_ENUM.PORTFOLIOS).insertAndGet(
      Object.keys(portfolioRow),
      Object.values(portfolioRow),
      ['id'],
    );

    createdIds.push(portfolioId);

    for (let i = 0; i < picked.length; i += 1) {
      await Query.table(TABLES_ENUM.PORTFOLIO_MEDIA).insert(
        ['portfolio_id', 'media_id', 'position'],
        [portfolioId, picked[i], i],
      );
    }
  }

  const extra = await Query.table(TABLES_ENUM.USER_EXTRA_DATA)
    .where('user_id', '=', user.id)
    .first<{ portfolios_count: number }>();

  if (extra) {
    await Query.table(TABLES_ENUM.USER_EXTRA_DATA)
      .where('user_id', '=', user.id)
      .update(
        ['portfolios_count'],
        [extra.portfolios_count + amount],
      );
  } else {
    Logger.warn(
      `No user_extra_data row for user_id=${user.id}; skipped portfolios_count bump.`,
    );
  }

  Logger.success(
    `Portfolio seed: created ${amount} portfolio(s) for user=${username} (ids: ${createdIds.join(', ')}).`,
  );
  await LogService.flush();
}

/**
 * @param username - When omitted or empty, uses {@link PORTFOLIO_SEED_USERNAME} (same pattern as `media.ts`).
 * @param amount - How many portfolios to create; default 1.
 */
export const main = async (username?: string, amount?: number) => {
  assertLocalAppEnv();
  const resolved = username?.trim() || PORTFOLIO_SEED_USERNAME;
  const n = resolveSeedAmount(amount);
  await seedPortfolioForUsername(resolved, n);
};
