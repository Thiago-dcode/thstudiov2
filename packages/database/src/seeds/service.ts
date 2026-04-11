/**
 * Creates one or more services for a user (`amount`, default 1): faker title/description/slug,
 * optional `portfolio_id` (random user portfolio when available), `is_highlight: true`,
 * thumbnail from `src/seeds/media-images/` → S3 at `users/{public_id}/services/{slug}/thumbnail.webp`
 * (same sizing as {@link ServiceService} / `Helpers.setAsset`: 0.5 MB, quality 85). No AI moderation.
 *
 * Inserts `service_features` and `service_terms` like {@link ServiceRepository.create}.
 *
 * Default username is `thsworld` (same as `portfolio.ts` / `admin-user`).
 *
 * CLI:
 *   pnpm dbcli db:seed -n service
 *
 * Programmatic:
 *   await seedService();
 *   await seedService('otheruser', 3);
 *
 * Prerequisites: local app env; S3; `media-images/`; user exists. Portfolios optional (link when present).
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

const SERVICE_SEED_USERNAME = 'thsworld';

const ALLOWED_APP_ENVS = ['development', 'local', 'test'] as const;

function assertLocalAppEnv(): void {
  const env = getConfigValue('app').env.toLowerCase();
  if (
    !ALLOWED_APP_ENVS.includes(env as (typeof ALLOWED_APP_ENVS)[number])
  ) {
    throw new Error(
      `Service seed is only allowed in local environments (${ALLOWED_APP_ENVS.join(', ')}). Current app env: "${env}".`,
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

async function slugUniqueForUser(slug: string, userId: number): Promise<boolean> {
  const exists = await Query.table(TABLES_ENUM.SERVICES)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  faker: any,
  userId: number,
): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const words = faker.lorem.words(faker.number.int({ min: 2, max: 4 }));
    let slug = generateValidSlug(words);
    if (slug.length < 3) {
      slug = `svc-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}`;
    }
    if (attempt > 0) {
      slug = `${slug}-${faker.string.alphanumeric({ length: 4, casing: 'lower' })}`;
    }
    if (await slugUniqueForUser(slug, userId)) {
      return slug;
    }
  }
  throw new Error('Could not generate a unique service slug for this user.');
}

async function seedServiceForUsername(username: string, amount: number): Promise<void> {
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
    throw new Error(
      `No images in ${mediaDir}; need at least one for the service thumbnail.`,
    );
  }

  const portfolioRows = (await Query.table(TABLES_ENUM.PORTFOLIOS)
    .select(['id'])
    .where('user_id', '=', user.id)
    .get()) as { id: number }[];
  const portfolioIds = portfolioRows.map((r) => r.id);

  const s3Config = buildS3Config();
  const storageService = FactoryStorageService.create(s3Config);
  const compressService = FactoryCompressService.create({ driver: 'sharp' });
  const targetThumbBytes = Math.floor(0.5 * 1024 * 1024);

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

    const thumbnailStoragePath = `users/${user.public_id}/services/${slug}/thumbnail.webp`;

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

    const showPrice = faker.datatype.boolean();
    const price = showPrice
      ? Math.round(parseFloat(faker.commerce.price({ min: 25, max: 999 })) * 100) / 100
      : null;

    const portfolioId =
      portfolioIds.length > 0
        ? faker.helpers.arrayElement(portfolioIds)
        : null;

    const serviceRow: Record<string, string | number | boolean | null> = {
      title,
      slug,
      description,
      thumbnail: thumbnailStoragePath,
      price,
      is_active: true,
      is_featured: false,
      is_highlight: true,
      show_price: showPrice,
      user_id: user.id,
      portfolio_id: portfolioId,
    };

    const { id: serviceId } = await Query.table(TABLES_ENUM.SERVICES).insertAndGet(
      Object.keys(serviceRow),
      Object.values(serviceRow),
      ['id'],
    );

    createdIds.push(serviceId);

    const nFeatures = faker.number.int({ min: 2, max: 5 });
    for (let f = 0; f < nFeatures; f += 1) {
      const featureTitle = faker.lorem
        .words(faker.number.int({ min: 2, max: 5 }))
        .slice(0, 255);
      await Query.table(TABLES_ENUM.SERVICE_FEATURES).insert(
        ['title', 'service_id'],
        [featureTitle, serviceId],
      );
    }

    const nTerms = faker.number.int({ min: 2, max: 5 });
    for (let t = 0; t < nTerms; t += 1) {
      await Query.table(TABLES_ENUM.SERVICE_TERMS).insert(
        ['title', 'service_id'],
        [faker.lorem.sentence({ min: 3, max: 8 }).slice(0, 255), serviceId],
      );
    }
  }

  const extra = await Query.table(TABLES_ENUM.USER_EXTRA_DATA)
    .where('user_id', '=', user.id)
    .first<{ services_count: number }>();

  if (extra) {
    await Query.table(TABLES_ENUM.USER_EXTRA_DATA)
      .where('user_id', '=', user.id)
      .update(['services_count'], [extra.services_count + amount]);
  } else {
    Logger.warn(
      `No user_extra_data row for user_id=${user.id}; skipped services_count bump.`,
    );
  }

  Logger.success(
    `Service seed: created ${amount} service(s) for user=${username} (ids: ${createdIds.join(', ')}).`,
  );
  await LogService.flush();
}

/**
 * @param username - When omitted or empty, uses default admin username (`thsworld`).
 * @param amount - How many services to create; default 1.
 */
export const main = async (username?: string, amount?: number) => {
  assertLocalAppEnv();
  const resolved = username?.trim() || SERVICE_SEED_USERNAME;
  const n = resolveSeedAmount(amount);
  await seedServiceForUsername(resolved, n);
};
